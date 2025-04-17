try {
    window.DataTableVue = {
        mount: function (selector) {
            const element = document.querySelector(selector);
            if (!element) {
                console.error('Element not found:', selector);
                return;
            }

            let currentConfig = null;

            // Рендеринг таблиці
            const renderTable = (data) => {
                // Очищаємо елемент перед рендерингом
                element.innerHTML = `
                    <div class="filters mb-8"></div>
                    <div class="table-wrapper">
                        <table class="table table-sm table-p-md">
                            <thead>
                                <tr></tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                    </div>
                    <div class="pager"></div>
                `;

                // Рендеринг заголовків
                const theadRow = element.querySelector('thead tr');
                currentConfig.columns.forEach(col => {
                    const th = document.createElement('th');
                    th.className = 'p-datatable-header-cell p-datatable-sortable-column';
                    th.setAttribute('tabindex', '0');
                    th.setAttribute('role', 'columnheader');
                    th.innerHTML = `
                        <div class="p-datatable-column-header-content">
                            <span class="p-datatable-column-title">${col.title}</span>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" class="p-datatable-sort-icon" aria-hidden="true" sortOrder="0">
                                <path d="M5.64515 3.61291C5.47353 3.61291 5.30192 3.54968 5.16644 3.4142L3.38708 1.63484L1.60773 3.4142C1.34579 3.67613 0.912244 3.67613 0.650309 3.4142C0.388374 3.15226 0.388374 2.71871 0.650309 2.45678L2.90837 0.198712C3.17031 -0.0632236 3.60386 -0.0632236 3.86579 0.198712L6.12386 2.45678C6.38579 2.71871 6.38579 3.15226 6.12386 3.4142C5.98837 3.54968 5.81676 3.61291 5.64515 3.61291Z" fill="currentColor"></path>
                                <path d="M3.38714 14C3.01681 14 2.70972 13.6929 2.70972 13.3226V0.677419C2.70972 0.307097 3.01681 0 3.38714 0C3.75746 0 4.06456 0.307097 4.06456 0.677419V13.3226C4.06456 13.6929 3.75746 14 3.38714 14Z" fill="currentColor"></path>
                                <path d="M10.6129 14C10.4413 14 10.2697 13.9368 10.1342 13.8013L7.87611 11.5432C7.61418 11.2813 7.61418 10.8477 7.87611 10.5858C8.13805 10.3239 8.5716 10.3239 8.83353 10.5858L10.6129 12.3652L12.3922 10.5858C12.6542 10.3239 13.0877 10.3239 13.3497 10.5858C13.6116 10.8477 13.6116 11.2813 13.3497 11.5432L11.0916 13.8013C10.9561 13.9368 10.7845 14 10.6129 14Z" fill="currentColor"></path>
                                <path d="M10.6129 14C10.2426 14 9.93552 13.6929 9.93552 13.3226V0.677419C9.93552 0.307097 10.2426 0 10.6129 0C10.9833 0 11.2904 0.307097 11.2904 0.677419V13.3226C11.2904 13.6929 10.9832 14 10.6129 14Z" fill="currentColor"></path>
                            </svg>
                        </div>
                    `;
                    theadRow.appendChild(th);
                });

                // Рендеринг рядків
                const tbody = element.querySelector('tbody');
                (data?.results?.list || []).forEach(row => {
                    const tr = document.createElement('tr');
                    tr.className = 'p-row-even';
                    currentConfig.columns.forEach(col => {
                        const td = document.createElement('td');
                        td.innerHTML = `<div>${row[col.name] || '--'}</div>`;
                        tr.appendChild(td);
                    });
                    tbody.appendChild(tr);
                });

                // Рендеринг фільтрів
                const filtersDiv = element.querySelector('.filters');
                filtersDiv.innerHTML = ''; // Очищаємо фільтри
                currentConfig.filters.forEach(filter => {
                    const div = document.createElement('div');
                    div.className = 'form-group';
                    div.innerHTML = `
                        <label class="control-label">${filter.title}</label>
                        <input type="text" name="${filter.name}" class="form-control" value="${filter.value || ''}"/>
                    `;
                    filtersDiv.appendChild(div);
                });

                // Рендеринг пагінації
                const pagerDiv = element.querySelector('.pager');
                const totalPages = Math.ceil((data?.results?.count || 0) / currentConfig.requestParams.pager.size);
                pagerDiv.innerHTML = `
                    <button class="btn-pager-prev ${currentConfig.requestParams.pager.page === 1 ? 'disabled' : ''}">Попередня</button>
                    <span>Сторінка ${currentConfig.requestParams.pager.page} з ${totalPages}</span>
                    <button class="btn-pager-next ${currentConfig.requestParams.pager.page === totalPages ? 'disabled' : ''}">Наступна</button>
                `;
            };

            const fetchData = (config) => {
                fetch(config.requestUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        filters: config.requestParams,
                        pager: config.requestParams.pager,
                        order: config.order
                    })
                })
                    .then(response => {
                        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
                        return response.json();
                    })
                    .then(data => {
                        document.dispatchEvent(new CustomEvent('datatable:dataLoaded', { detail: data }));
                        if (data?.results?.summary) {
                            document.dispatchEvent(new CustomEvent('summary:loaded', { detail: data.results.summary }));
                        }
                        // Рендеринг таблиці після отримання даних
                        renderTable(data);
                        // Додаємо обробники після рендерингу
                        handleSort();
                        handleFilters();
                        handlePagination();
                    })
                    .catch(error => {
                        document.dispatchEvent(new CustomEvent('datatable:error', { detail: { message: error.message } }));
                    });
            };

            // Обробка сортування
            const handleSort = () => {
                const headers = element.querySelectorAll('.p-datatable-sortable-column');
                headers.forEach(th => {
                    th.removeEventListener('click', sortHandler); // Видаляємо старі обробники
                    th.addEventListener('click', sortHandler);
                });
            };

            const sortHandler = (e) => {
                const th = e.currentTarget;
                const columnTitle = th.querySelector('.p-datatable-column-title').textContent.trim();
                const sortIcon = th.querySelector('.p-datatable-sort-icon');
                let direction = sortIcon.getAttribute('sortOrder') === '0' ? 'asc' :
                    sortIcon.getAttribute('sortOrder') === '1' ? 'desc' : 'asc';
                sortIcon.setAttribute('sortOrder', direction === 'asc' ? '1' : direction === 'desc' ? '-1' : '0');

                const column = currentConfig.columns.find(col => col.title === columnTitle)?.name;
                if (column) {
                    currentConfig.order = { [column]: direction };
                    document.dispatchEvent(new CustomEvent('datatable:sort', {
                        detail: { column, direction }
                    }));
                    fetchData(currentConfig);
                }
            };

            // Обробка фільтрів
            const handleFilters = () => {
                const filterInputs = element.querySelectorAll('.filters input');
                filterInputs.forEach(input => {
                    input.removeEventListener('input', filterHandler); // Видаляємо старі обробники
                    input.addEventListener('input', filterHandler);
                });
            };

            const filterHandler = (e) => {
                const input = e.target;
                const filterName = input.getAttribute('name');
                const filterValue = input.value;
                currentConfig.filters = currentConfig.filters.map(f =>
                    f.name === filterName ? { ...f, value: filterValue } : f
                );
                document.dispatchEvent(new CustomEvent('datatable:filterUpdate', {
                    detail: { filter: { name: filterName, value: filterValue } }
                }));
                fetchData(currentConfig);
            };

            // Обробка пагінації
            const handlePagination = () => {
                const prevBtn = element.querySelector('.btn-pager-prev');
                const nextBtn = element.querySelector('.btn-pager-next');
                if (prevBtn) {
                    prevBtn.removeEventListener('click', prevHandler);
                    prevBtn.addEventListener('click', prevHandler);
                }
                if (nextBtn) {
                    nextBtn.removeEventListener('click', nextHandler);
                    nextBtn.addEventListener('click', nextHandler);
                }
            };

            const prevHandler = () => {
                if (currentConfig.requestParams.pager.page > 1) {
                    currentConfig.requestParams.pager.page--;
                    fetchData(currentConfig);
                }
            };

            const nextHandler = () => {
                currentConfig.requestParams.pager.page++;
                fetchData(currentConfig);
            };

            document.addEventListener('datatable:setConfig', (e) => {
                currentConfig = e.detail;
                // Скидаємо пагінацію і порядок при новій конфігурації
                currentConfig.requestParams.pager.page = 1;
                currentConfig.order = currentConfig.order || {};
                // Очищаємо фільтри, зберігаючи лише структуру
                currentConfig.filters = currentConfig.filters.map(f => ({ ...f, value: '' }));
                fetchData(currentConfig);
            });

            document.addEventListener('datatable:reload', () => {
                if (currentConfig) {
                    fetchData(currentConfig);
                } else {
                    console.log('No config available for reload');
                }
            });
        }
    };

    const datatable = document.getElementById('datatable') || document.getElementById('data_table');
    if (datatable && window.DataTableVue.mount) {
        window.DataTableVue.mount('#datatable');
    }
} catch (e) {
    console.log('Error in index-vcsAY5z7.js:', e);
}