<?php declare(strict_types=1);

use yii\helpers\Html;

App\Assets\DataTableVueAssets::register($this);

?>

<div class="container">
    <div class="mb-10">
        <div class="flex">
            <div class="flex-size-6 btn-set">
                <?= Html::a('Внески', ['/summary-info/ingoing'], ['class' => 'btn btn-tab']) ?>
                <?= Html::a('Витрати', ['/summary-info/outgoing'], ['class' => 'btn btn-tab btn-tab-active']) ?>
            </div>
            <div class="flex-size-6 text-align-right">
            </div>
        </div>
    </div>

    <!-- Зведена інформація -->
    <div class="mb-10">
        <h4 class="mb-0 p-4 bg-dark-gray size-xl">Загальна інформація</h4>
        <table id="summary_info_table" class="mb-8 table table-p-md table-sm">
            <colgroup>
                <col width="20%" />
                <col width="20%" />
                <col width="20%" />
                <col width="20%" />
                <col width="20%" />
            </colgroup>
            <thead>
            <tr>
                <th>Тип витрат</th>
                <th>Кількість</th>
                <th>Сума витрат</th>
                <th>Сума повернень</th>
                <th>Сума на даній сторінці</th>
            </tr>
            </thead>
            <tbody>
            <tr>
                <td name="summary_info_type" class="text-center">--</td>
                <td name="summary_info_qty" class="text-center">--</td>
                <td name="summary_info_summ" class="text-center">0,00</td>
                <td name="refund_info_summ" class="text-center">0,00</td>
                <td name="current_summary_info_summ" class="text-center">0,00</td>
            </tr>
            </tbody>
        </table>
    </div>

    <!-- Фільтр operation_type -->
    <div class="mb-10">
        <div class="flex">
            <div class="flex-size-6 btn-set">
                <div class="filter-group table-controls">
                    <label class="block mb-2"  for="operation_type">Тип внеску:</label>
                    <select id="operation_type" class="form-control">
                        <option value="budget_expenses" selected>Платежі з окремого рахунку</option>
                        <option value="outgoing_expenses">Платежі з інших рахунків</option>
                        <option value="return_expenses">Повернення грошових внесків</option>
                        <option value="transfer_expenses">Повернення інших внесків</option>
                    </select>
                </div>
            </div>
            <div class="flex-size-6 btn-set">
                <div class="filter-group table-controls">
                    <label class="block mb-2" for="office-type-select">Тип осередку:</label>
                    <select id="office-type-select" class="form-control">
                        <option class="p-select-label" value="Центральний офіс" >Центральний офіс</option>
                        <option class="p-select-label" value="Всі регіональні осередки" >Всі регіональні осередки</option>
                        <option class="p-select-label" value="Центральний офіс + Всі регіональні осередки" selected>Центральний офіс + Всі регіональні осередки</option>
                    </select>
                </div>
            </div>
        </div>
    </div>

    <!-- Таблиця даних -->
    <div id="error_messages"></div>
    <div id="datatable"></div>
</div>

<script>
    // Конфігурація колонок
    const tableColumns = {
        budget_expenses: [
            { name: 'party_name', title: 'Найменування політичної партії', visible: true, sortable: false },
            { name: 'party_code', title: 'ЄДРПОУ політичної партії', visible: true, sortable: false },
            { name: 'office_name', title: 'Найменування регіонального осередку', visible: true, sortable: false },
            { name: 'office_code', title: 'ЄДРПОУ регіонального осередку', visible: true, sortable: false },
            { name: 'payment_operation_date', title: 'Дата здійснення платежу', visible: true, sortable: true },
            { name: 'payment_reason', title: 'Підстава для здійснення платежу', visible: true, sortable: true },
            { name: 'receiver_type', title: 'Тип особи', visible: true, sortable: true },
            { name: 'receiver_name', title: 'ПІБ фізичної особи/ФОП', visible: true, sortable: true},
            { name: 'receiver_code', title: 'РНОКПП/ серія та номер паспорта, номер, ID-картки/ ідентифікаційний код юридичної особи', visible: true, sortable: true },
            { name: 'payment_purpose', title: 'Цільове призначення платежу', visible: true, sortable: true },
            { name: 'payment_amount', title: 'Сума платежу', visible: true, sortable: true },
        ],
        outgoing_expenses: [
            {name: 'party_name', title: 'Найменування політичної партії', visible: true, sortable: false},
            {name: 'party_code', title: 'ЄДРПОУ політичної партії', visible: true, sortable: false},
            {name: 'office_name', title: 'Найменування регіонального осередку', visible: true, sortable: false},
            {name: 'office_code', title: 'ЄДРПОУ регіонального осередку', visible: true, sortable: false},
            {name: 'payment_operation_date', title: 'Дата здійснення платежу', visible: true, sortable: true},
            {name: 'payment_reason', title: 'Підстава для здійснення платежу', visible: true, sortable: true},
            {name: 'receiver_type', title: 'Тип особи', visible: true, sortable: true},
            {name: 'receiver_name', title: 'ПІБ фізичної особи/ФОП/ найменування юридичної особи, на користь якої здійснено платіж', visible: true, sortable: true},
            {name: 'receiver_code', title: 'РНОКПП/ серія та номер паспорта, номер, ID-картки/ ідентифікаційний код юридичної особи', visible: true, sortable: true},
            {name: 'payment_purpose', title: 'Цільове призначення платежу', visible: true, sortable: true},
            {name: 'payment_amount', title: 'Сума платежу', visible: true, sortable: true},
        ],
        return_expenses: [
            { name: 'party_name', title: 'Найменування політичної партії', visible: true, sortable: false },
            { name: 'party_code', title: 'ЄДРПОУ політичної партії', visible: true, sortable: false },
            { name: 'office_name', title: 'Найменування регіонального осередку', visible: true, sortable: false },
            { name: 'office_code', title: 'ЄДРПОУ регіонального осередку', visible: true, sortable: false },
            { name: 'receiver_bank_name', title: 'Найменування установи, в якій відкрито рахунок політичної партії/її місцевої організації', visible: true, sortable: true},
            { name: 'receiver_account_iban', title: 'Номер рахунку', visible: true, sortable: true},
            { name: 'payment_operation_date', title: 'Дата отримання', visible: true, sortable: true},
            {name: 'receiver_name', title: 'ПІБ фізичної особи/ФОП/ найменування юридичної особи', visible: true, sortable: true},
            {name: 'receiver_code', title: 'РНОКПП/ серія та номер паспорта, номер, ID-картки/  ідентифікацій-ний код юридичної особи', visible: true, sortable: true},
            {name: 'payment_amount', title: 'Сума платежу', visible: true, sortable: true},
            {name: 'refund_date', title: 'Дата повернення/ перерахування', visible: true, sortable: true},
            {name: 'refund_reason', title: 'Обгрунтування', visible: true, sortable: true},
            {name: 'refund_amount', title: 'Сума повернення', visible: true, sortable: true},
            {name: 'refund_budget_amount', title: 'Сума, що перераховується (повертається) до державного бюджету', visible: true, sortable: true},
        ],
        transfer_expenses: [
            { name: 'party_name', title: 'Найменування політичної партії', visible: true, sortable: false },
            { name: 'party_code', title: 'ЄДРПОУ політичної партії', visible: true, sortable: false },
            { name: 'office_name', title: 'Найменування регіонального осередку', visible: true, sortable: false },
            { name: 'office_code', title: 'ЄДРПОУ регіонального осередку', visible: true, sortable: false },
            {name: 'payment_type', title: 'Вид внеску', visible: true, sortable: true},
            {name: 'payment_operation_date', title: 'Дата отримання внеску', visible: true, sortable: true},
            {name: 'receiver_name', title: 'ПІБ фізичної особи/ФОП/ найменування юридичної особи', visible: true, sortable: true},
            {name: 'receiver_code', title: 'РНОКПП/ серія та номер паспорта, номер, ID-картки/  ідентифікаційний код юридичної особи', visible: true, sortable: true},
            {name: 'payment_amount', title: 'Сума платежу', visible: true, sortable: true},
            {name: 'refund_date', title: 'Дата повернення/ перерахування', visible: true, sortable: true},
            {name: 'refund_reason', title: 'Обгрунтування', visible: true, sortable: true},
            {name: 'refund_amount', title: 'Сума повернення', visible: true, sortable: true},
        ],
    };

    // Конфігурація фільтрів
    const tableFilters = {
        budget_expenses: [
            { name: 'office_type', type: 'string', title: 'тип', visible: false },
            { name: 'party_name', type: 'string', title: 'Найменування політичної партії', visible: true },
            { name: 'party_code', type: 'string', title: 'ЄДРПОУ політичної партії', visible: true },
            { name: 'office_name',type: 'string', title: 'Найменування регіонального осередку', visible: true },
            { name: 'office_code',type: 'string', title: 'ЄДРПОУ регіонального осередку', visible: true },
            { name: 'receiver_name',type: 'string', title: 'ПІБ/найменування юридичної особи, на користь якої здійснено платіж', visible: true },
            { name: 'receiver_code',type: 'string', title: 'РНОКПП/ЄДРПОУ', visible: true },
            { name: 'payment_purpose',type: 'string', title: 'Цільове призначення платежу', visible: true },
            { name: 'payment_amount',type: 'string', title: 'Сума платежу', visible: true },
            { name: 'payment_operation_date', type: 'date_range', title: 'Дата здійснення платежу', visible: true },
        ],
        outgoing_expenses: [
            { name: 'office_type', type: 'string', title: 'тип', visible: false },
            { name: 'party_name', type: 'string', title: 'Найменування політичної партії', visible: true },
            { name: 'party_code', type: 'string', title: 'ЄДРПОУ політичної партії', visible: true, visible: true },
            { name: 'office_name', type: 'string', title: 'Найменування регіонального осередку', visible: true },
            { name: 'office_code', type: 'string', title: 'ЄДРПОУ регіонального осередку', visible: true },
            { name: 'receiver_name', type: 'string', title: 'ПІБ/найменування юридичної особи, на користь якої здійснено платіж', visible: true },
            { name: 'receiver_code', type: 'string', title: 'РНОКПП/ЄДРПОУ', visible: true },
            { name: 'payment_purpose', type: 'string', title: 'Цільове призначення платежу', visible: true },
            { name: 'payment_amount', type: 'string', title: 'Сума платежу' },
            { name: 'payment_operation_date', type: 'date_range', title: 'Дата здійснення платежу', visible: true },
        ],
        return_expenses: [
            { name: 'office_type', type: 'string', title: 'тип', visible: false },
            { name: 'party_name', title: 'Найменування політичної партії', type: 'string', visible: true },
            { name: 'party_code', title: 'ЄДРПОУ політичної партії', type: 'string', visible: true },
            { name: 'office_name', title: 'Найменування регіонального осередку', type: 'string', visible: true },
            { name: 'office_code', title: 'ЄДРПОУ регіонального осередку', type: 'string', visible: true },
            { name: 'receiver_name', title: 'ПІБ/найменування юридичної особи', type: 'string', visible: true },
            { name: 'receiver_code', title: 'РНОКПП/ЄДРПОУ', type: 'string', visible: true },
            { name: 'payment_amount', title: 'Сума платежу', type: 'string', visible: true },
            { name: 'payment_operation_date', title: 'Дата отримання', type: 'date_range', visible: true },
        ],
        transfer_expenses: [
            { name: 'office_type', type: 'string', title: 'тип', visible: false },
            { name: 'party_name', title: 'Найменування політичної партії', type: 'string', visible: true },
            { name: 'party_code', title: 'ЄДРПОУ політичної партії', type: 'string', visible: true },
            { name: 'office_name', title: 'Найменування регіонального осередку', type: 'string', visible: true },
            { name: 'office_code', title: 'ЄДРПОУ регіонального осередку', type: 'string', visible: true },
            { name: 'receiver_name', title: 'ПІБ/найменування юридичної особи', type: 'string', visible: true },
            { name: 'receiver_code', title: 'РНОКПП/ЄДРПОУ', type: 'string', visible: true },
            { name: 'payment_amount', title: 'Сума платежу', type: 'string', visible: true },
            { name: 'payment_operation_date', title: 'Дата отримання внеску', type: 'date_range', visible: true },
        ],
    };

    // Ініціалізація
    const init = () => {
        // Очищення кешу
        localStorage.removeItem('summary_info_ingoing');
        localStorage.removeItem('summary_info_outgoing');
        // console.log('Starting initialization...');
        // Перевірка наявності #datatable
        const datatableElement = document.getElementById('datatable');
        if (!datatableElement) {
            const errorDiv = document.getElementById('error_messages');
            if (errorDiv) {
                errorDiv.innerHTML = '<div class="alert alert-danger">Помилка: елемент #datatable не знайдено</div>';
            }
            return;
        }

        // Дебагінг скриптів
        // console.log('Scripts loaded:', Array.from(document.getElementsByTagName('script')).map(s => s.src));

        let currentOperationType = 'budget_expenses';
        const officeTypeSelect = document.getElementById('office-type-select');
        const getOfficeType = () => officeTypeSelect.value;
        // console.log('getOfficeType ----->', getOfficeType() );
        const getConfig = () => ({
            requestUrl: '/api/v1/party/summary-info/list',
            downloadUrl: '/api/v1/party/summary-info/download',
            storageKey: 'summary_info_outgoing',
            columns: tableColumns[currentOperationType],
            filters: tableFilters[currentOperationType],
            order: { payment_operation_date: 'desc' },
            requestParams: {
                group_code: currentOperationType,
                operation_type: currentOperationType,
                pager: { page: 1, size: 20 },
                office_type: getOfficeType(),
            },

            showDownload: true,
        });
// Отримання значення office_type із селекту


        let config = getConfig();
        // console.log('Initial config:', config);

        const updateSummary = (summary) => {
            // console.log('Updating summary:', summary);
            const row = document.querySelector('#summary_info_table tbody tr');
            // console.log('Summary table row:', row);
            if (row) {
                // console.log('SUMMARY - VIEW:', summary);
                row.querySelector('[name="summary_info_type"]').textContent = summary?.payment_type || 'Немає даних';
                row.querySelector('[name="summary_info_qty"]').textContent = summary?.count || '0';
                row.querySelector('[name="summary_info_summ"]').textContent = summary?.payment_amount || '0,00';
                row.querySelector('[name="refund_info_summ"]').textContent = summary?.refund_amount || '0,00';
            } else {
                // console.error('Summary table row not found');
            }
        };
        // Парсинг і підсумок payment_amount для поточної сторінки
        const parsePaymentAmounts = () => {
            let formattedSum = 0.00;
            const table = document.querySelector('#datatable table');
            if (!table) {
                // console.error('DataTable table not found');
                return;
            }

            // Знаходимо індекс колонки payment_amount

            const headers = table.querySelectorAll('thead th');

            let amountIndex = -1;

            headers.forEach((th, index) => {
                const title = th.querySelector('.p-datatable-column-title');
                if (title && title.textContent.trim() === 'Сума платежу') {
                    amountIndex = index;
                }
            });

            if (amountIndex === -1) {
                // console.error('Column "Сума платежу" not found');
                return;
            }

            // Беремо рядки tbody (поточна сторінка пагінації)
            const rows = table.querySelectorAll('tbody tr');
            // console.log("Pagination qty: ", rows.length)
            let totalAmount = 0;

            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells[amountIndex]) {
                    const amountDiv = cells[amountIndex].querySelector('div');
                    if (amountDiv) {
                        const amountText = amountDiv.textContent.trim();
                        // Парсинг суми: "200,00" → 200.00
                        const amount = parseFloat(amountText.replace(/\s/g, '').replace(',', '.')) || 0;
                        totalAmount += amount;
                    }
                }
            });
            let rowSumary = document.querySelector('#summary_info_table tbody tr');
            const formatter = new Intl.NumberFormat('uk-UA', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            formattedSum = formatter.format(totalAmount.toFixed(2));
            // console.log('formattedSum', formattedSum);
            rowSumary.querySelector('[name="current_summary_info_summ"]').textContent = formattedSum || '0,00';
        };

        document.addEventListener('datatable:dataLoaded', (e) => {
            // Очищення кешу
            localStorage.removeItem('summary_info_ingoing');
            localStorage.removeItem('summary_info_outgoing');
            // console.log('Data loaded view!!!!!:', e.detail);
            const data = e.detail;
            if (data?.results?.summary) {
                // console.log('Summary received:', data.results.summary);
                updateSummary(data.results.summary);
            } else {
                // console.warn('No summary data received');
                updateSummary({
                    payment_type: currentOperationType || 'Немає даних',
                    count: 0,
                    payment_amount: '0,00',
                });
            }

            // Виклик парсингу після оновлення таблиці
            setTimeout(parsePaymentAmounts, 500); // Затримка для рендерингу

        });

        // Обробка зміни operation_type
        const operationTypeSelect = document.getElementById('operation_type');
        operationTypeSelect.addEventListener('change', (e) => {
            currentOperationType = e.target.value;
            // console.log('Switching to operation_type:', currentOperationType);
            config = getConfig();
            // console.log('New config:', config);
            document.dispatchEvent(new CustomEvent('datatable:setConfig', { detail: config }));
            document.dispatchEvent(new CustomEvent('datatable:reload'));
            setTimeout(parsePaymentAmounts, 500); // Затримка для рендерингу
        });

        // Обробка помилок
        document.addEventListener('datatable:error', (e) => {
            // console.error('DataTable error:', e.detail);
            const errorDiv = document.getElementById('error_messages');
            if (errorDiv) {
                errorDiv.innerHTML = `<div class="alert alert-danger">Помилка завантаження даних: ${e.detail?.message || 'Невідома помилка'}</div>`;
            }
        });

        // Обробка сортування
        document.addEventListener('datatable:sort', (e) => {
            // console.log('Sort event:', e.detail);
        });

        document.addEventListener('datatable:filterUpdate', (e) => {
            // console.log('Filter updated:', e.detail);
            if (e.detail?.filter?.name === 'payment_amount') {
                e.detail.filter.value = e.detail.filter.value.replace(/[\s,]/g, '');
                // console.log('Cleaned payment_amount:', e.detail.filter.value);
            }
            setTimeout(parsePaymentAmounts, 500); // Затримка для рендерингу
        });

        // Ініціалізація

        // Оновлення даних при зміні office_type
        officeTypeSelect.addEventListener('change', () => {
            config.requestParams.office_type = getOfficeType();
            document.dispatchEvent(new CustomEvent('datatable:setConfig', { detail: config }));
        });

        document.addEventListener('click', (e) => {
            const operation_table = document.querySelector('#datatable');
            if (operation_table) {
                operation_table.addEventListener('click', (e) => {
                    // Виклик парсингу після оновлення таблиці
                    setTimeout(parsePaymentAmounts, 500); // Затримка для рендерингу
                });
            }
        });

        document.dispatchEvent(new CustomEvent('datatable:setConfig', {detail: config}));



        document.dispatchEvent(new CustomEvent('datatable:reload'));
    };



    document.addEventListener('DOMContentLoaded', () => {
        // console.log('DOM fully loaded');
        init();
    });

    window.addEventListener('load', () => {
        console.log('Window fully loaded, DataTableVue:', !!window.DataTableVue);
    });
</script>

<style>
    .container {
        max-width: 1200px;
        margin: 0 auto;
    }
    .btn-set .btn {
        margin-right: 10px;
    }
    .bg-dark-gray {
        background-color: rgba(51, 51, 51, 0.73);
        color: #fff;
    }
    .alert-danger {
        color: #721c24;
        background-color: #f8d7da;
        border-color: #f5c6cb;
        padding: 10px;
        margin-bottom: 15px;
    }
    .alert-info {
        color: #0c5460;
        background-color: #d1ecf1;
        border-color: #bee5eb;
        padding: 10px;
        margin-bottom: 15px;
    }
    .form-control {
        padding: 5px;
        margin: 5px 10px;
        width: auto;
    }
    .filter-group {
        display: inline-block;
        margin-right: 20px;
    }
    .filter-group label {
        display: block;
        font-size: 14px;
    }
    .table-controls {
        label {
            padding: 5px;
            margin-left: 10px;
            font-size: .9rem;
            color: #555;
        }
    }
    .table-controls label {
        margin-right: 10px;
    }
    .mb-8 {
        margin-bottom: 1rem !important;
    }
</style>