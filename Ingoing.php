<?php declare(strict_types=1);

use yii\helpers\Html;

Yii::$app->params['pageTitle'] = 'Зведена інформація - Внески';
Yii::$app->params['pageSubtitle'] = 'Перегляд внесків';
Yii::$app->params['pageHeader'] = Yii::$app->params['pageSubtitle'];
Yii::$app->params['breadCrumbs'] = [
    ['label' => 'Зведена інформація', 'url' => ['/summary-info/ingoing']],
    ['label' => 'Внески'],
];
?>

<div class="container">
    <!-- Вкладки -->
    <div class="mb-10">
        <div class="flex">
            <div class="flex-size-6 btn-set">
                <?= Html::a('Внески', ['/summary-info/ingoing'], ['class' => 'btn btn-tab btn-tab-active']) ?>
                <?= Html::a('Витрати', ['/summary-info/outgoing'], ['class' => 'btn btn-tab']) ?>
            </div>
            <div class="flex-size-6 text-align-right">
                <button id="download-btn" class="btn btn-tab">Вивантажити</button>
            </div>
        </div>
    </div>

    <!-- Зведена інформація -->
    <div class="mb-10">
        <h4 class="mb-0 p-4 bg-dark-gray size-xl">Загальна інформація</h4>
        <table id="summary_info" class="mb-8 table table-p-md table-sm">
            <colgroup>
                <col width="40%" />
                <col width="30%" />
                <col width="30%" />
            </colgroup>
            <thead>
            <tr>
                <th>Тип внеску</th>
                <th>Кількість</th>
                <th>Сума</th>
            </tr>
            </thead>
            <tbody>
            <tr>
                <td>--</td>
                <td>--</td>
                <td>--</td>
            </tr>
            </tbody>
        </table>
    </div>

    <!-- Фільтри -->
    <div class="mb-10">
        <div class="filter-group">
            <label for="operation_type">Тип внеску:</label>
            <select id="operation_type" class="form-control">
                <option value="monetary_contributions" selected>Грошові внески</option>
                <option value="other_contributions">Інші внески</option>
                <option value="state_funding">Кошти державного фінансування</option>
                <option value="other_incomes">Інші надходження</option>
            </select>
        </div>
        <div class="filter-group">
            <label for="party_name">Назва партії:</label>
            <input type="text" id="party_name" class="form-control" placeholder="Введіть назву">
        </div>
        <div class="filter-group">
            <label for="payer_name">ПІБ/Юр. особа:</label>
            <input type="text" id="payer_name" class="form-control" placeholder="Введіть ПІБ або назву">
        </div>
        <div class="filter-group">
            <label for="payment_amount">Сума внеску:</label>
            <input type="text" id="payment_amount" class="form-control" placeholder="Напр. 10000,00">
        </div>
        <div class="filter-group">
            <label for="payment_operation_date">Дата внеску:</label>
            <input type="text" id="payment_operation_date" class="form-control" placeholder="Напр. 20.03.2025">
        </div>
    </div>

    <!-- Таблиця даних -->
    <div id="error_messages"></div>
    <div id="datatable"></div>
</div>

<script>
    // Конфігурація колонок
    const tableColumns = {
        monetary_contributions: [
            { name: 'party_name', title: 'Найменування політичної партії', visible: true, sortable: true, value: (row) => row?.party_name || '--' },
            { name: 'party_code', title: 'ЄДРПОУ політичної партії', visible: true, sortable: true, value: (row) => row?.party_code || '--' },
            { name: 'office_name', title: 'Найменування регіонального осередку', visible: true, sortable: true, value: (row) => row?.office_name || '--' },
            { name: 'office_code', title: 'ЄДРПОУ регіонального осередку', visible: true, sortable: true, value: (row) => row?.office_code || '--' },
            { name: 'payer_name', title: 'ПІБ/найменування юридичної особи', visible: true, sortable: true, value: (row) => row?.payer_name || '--' },
            { name: 'payer_code', title: 'РНОКПП/ЄДРПОУ', visible: true, sortable: true, value: (row) => row?.payer_code || '--' },
            { name: 'payer_type', title: 'Тип особи', visible: true, sortable: true, value: (row) => row?.payer_type || '--' },
            { name: 'payer_birthday', title: 'Дата народження', visible: true, sortable: true, value: (row) => row?.payer_birthday || '--' },
            { name: 'payer_address', title: 'Місце проживання', visible: true, sortable: true, value: (row) => row?.payer_address || '--' },
            { name: 'receiver_bank_name', title: 'Назва банку', visible: true, sortable: true, value: (row) => row?.receiver_bank_name || '--' },
            { name: 'receiver_account_iban', title: 'Номер рахунку', visible: true, sortable: true, value: (row) => row?.receiver_account_iban || '--' },
            { name: 'payment_operation_date', title: 'Дата внеску', visible: true, sortable: true, value: (row) => row?.payment_operation_date || '--' },
            { name: 'payment_amount', title: 'Сума внеску', visible: true, sortable: true, value: (row) => row?.payment_amount || '--' },
        ],
        other_contributions: [
            { name: 'party_name', title: 'Найменування політичної партії', visible: true, sortable: true, value: (row) => row?.party_name || '--' },
            { name: 'party_code', title: 'ЄДРПОУ політичної партії', visible: true, sortable: true, value: (row) => row?.party_code || '--' },
            { name: 'office_name', title: 'Найменування регіонального осередку', visible: true, sortable: true, value: (row) => row?.office_name || '--' },
            { name: 'office_code', title: 'ЄДРПОУ регіонального осередку', visible: true, sortable: true, value: (row) => row?.office_code || '--' },
            { name: 'payment_type', title: 'Вид внеску', visible: true, sortable: true, value: (row) => row?.payment_type || '--' },
            { name: 'payer_name', title: 'ПІБ/найменування юридичної особи', visible: true, sortable: true, value: (row) => row?.payer_name || '--' },
            { name: 'payer_code', title: 'РНОКПП/ЄДРПОУ', visible: true, sortable: true, value: (row) => row?.payer_code || '--' },
            { name: 'payer_type', title: 'Тип особи', visible: true, sortable: true, value: (row) => row?.payer_type || '--' },
            { name: 'payer_birthday', title: 'Дата народження', visible: true, sortable: true, value: (row) => row?.payer_birthday || '--' },
            { name: 'payer_address', title: 'Місце проживання', visible: true, sortable: true, value: (row) => row?.payer_address || '--' },
            { name: 'payment_operation_date', title: 'Дата внеску', visible: true, sortable: true, value: (row) => row?.payment_operation_date || '--' },
            { name: 'payment_amount', title: 'Вартість внеску', visible: true, sortable: true, value: (row) => row?.payment_amount || '--' },
        ],
        state_funding: [
            { name: 'party_name', title: 'Найменування політичної партії', visible: true, sortable: true, value: (row) => row?.party_name || '--' },
            { name: 'party_code', title: 'ЄДРПОУ політичної партії', visible: true, sortable: true, value: (row) => row?.party_code || '--' },
            { name: 'office_name', title: 'Найменування регіонального осередку', visible: true, sortable: true, value: (row) => row?.office_name || '--' },
            { name: 'office_code', title: 'ЄДРПОУ регіонального осередку', visible: true, sortable: true, value: (row) => row?.office_code || '--' },
            { name: 'payment_type', title: 'Форма фінансування', visible: true, sortable: true, value: (row) => row?.payment_type || '--' },
            { name: 'receiver_bank_name', title: 'Назва банку', visible: true, sortable: true, value: (row) => row?.receiver_bank_name || '--' },
            { name: 'receiver_account_iban', title: 'Номер рахунку', visible: true, sortable: true, value: (row) => row?.receiver_account_iban || '--' },
            { name: 'payment_operation_date', title: 'Дата надходження', visible: true, sortable: true, value: (row) => row?.payment_operation_date || '--' },
            { name: 'payment_amount', title: 'Сума надходження', visible: true, sortable: true, value: (row) => row?.payment_amount || '--' },
            { name: 'refund_amount', title: 'Сума повернення', visible: true, sortable: true, value: (row) => row?.refund_amount || '--' },
        ],
        other_incomes: [
            { name: 'party_name', title: 'Найменування політичної партії', visible: true, sortable: true, value: (row) => row?.party_name || '--' },
            { name: 'party_code', title: 'ЄДРПОУ політичної партії', visible: true, sortable: true, value: (row) => row?.party_code || '--' },
            { name: 'office_name', title: 'Найменування регіонального осередку', visible: true, sortable: true, value: (row) => row?.office_name || '--' },
            { name: 'office_code', title: 'ЄДРПОУ регіонального осередку', visible: true, sortable: true, value: (row) => row?.office_code || '--' },
            { name: 'payment_type', title: 'Вид надходження', visible: true, sortable: true, value: (row) => row?.payment_type || '--' },
            { name: 'payment_description', title: 'Опис надходження', visible: true, sortable: true, value: (row) => row?.payment_description || '--' },
            { name: 'payer_name', title: 'ПІБ/найменування юридичної особи', visible: true, sortable: true, value: (row) => row?.payer_name || '--' },
            { name: 'payer_type', title: 'Тип особи', visible: true, sortable: true, value: (row) => row?.payer_type || '--' },
            { name: 'payment_operation_date', title: 'Дата надходження', visible: true, sortable: true, value: (row) => row?.payment_operation_date || '--' },
            { name: 'receiver_bank_name', title: 'Назва банку', visible: true, sortable: true, value: (row) => row?.receiver_bank_name || '--' },
            { name: 'receiver_account_iban', title: 'Номер рахунку', visible: true, sortable: true, value: (row) => row?.receiver_account_iban || '--' },
            { name: 'payment_amount', title: 'Сума надходження', visible: true, sortable: true, value: (row) => row?.payment_amount || '--' },
        ],
    };

    // Ініціалізація
    document.addEventListener('DOMContentLoaded', () => {
        console.log('Starting initialization...');

        let currentOperationType = 'monetary_contributions';
        let tableData = [];
        let sortColumn = 'payment_operation_date';
        let sortDirection = 'desc';
        const filters = {
            party_name: '',
            payer_name: '',
            payment_amount: '',
            payment_operation_date: '',
        };

        // Функція рендерингу таблиці
        const renderTable = () => {
            console.log('Rendering table for:', currentOperationType);
            const table = document.getElementById('datatable');
            if (!table) {
                console.error('Table element not found');
                return;
            }

            const columns = tableColumns[currentOperationType];
            const headers = columns.map(col => `
                <th class="sortable" data-column="${col.name}">
                    ${col.title}
                    ${sortColumn === col.name ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                </th>
            `).join('');
            const rows = tableData.map(row => {
                const cells = columns.map(col => `<td>${col.value(row)}</td>`).join('');
                return `<tr>${cells}</tr>`;
            }).join('');

            table.innerHTML = `
                <table class="table table-bordered">
                    <thead><tr>${headers}</tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            `;

            // Додавання обробки кліків для сортування
            document.querySelectorAll('.sortable').forEach(th => {
                th.addEventListener('click', () => {
                    const column = th.dataset.column;
                    if (sortColumn === column) {
                        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
                    } else {
                        sortColumn = column;
                        sortDirection = 'asc';
                    }
                    loadData();
                });
            });
        };

        // Оновлення зведеної інформації
        const updateSummary = (summary) => {
            console.log('Updating summary:', summary);
            const values = [
                `<td>${summary?.payment_type || 'Грошові внески'}</td>`,
                `<td class="text-center">${summary?.count || '0'}</td>`,
                `<td class="text-center">${summary?.payment_amount || '0,00'}</td>`,
            ];
            const row = document.querySelector('#summary_info tbody tr');
            if (row) {
                row.innerHTML = values.join('');
            }
        };

        // Завантаження даних
        const loadData = async () => {
            console.log('Loading data for:', currentOperationType, 'Filters:', filters, 'Sort:', sortColumn, sortDirection);
            try {
                const requestFilters = { operation_type: currentOperationType };
                Object.keys(filters).forEach(key => {
                    if (filters[key]) requestFilters[key] = filters[key];
                });

                const response = await fetch('/api/v1/party/summary-info/list', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        filters: requestFilters,
                        order: { [sortColumn]: sortDirection },
                        pager: { page: 1, size: 10 },
                    }),
                });
                const data = await response.json();
                console.log('Data received:', data);

                if (data.results?.list) {
                    tableData = data.results.list;
                    renderTable();
                    updateSummary(data.results.summary || {
                        payment_type: 'Грошові внески',
                        count: data.results.count || 0,
                        payment_amount: '0,00',
                    });
                } else {
                    console.warn('No data received');
                    document.getElementById('error_messages').innerHTML = '<div class="alert alert-danger">Дані не знайдено</div>';
                }
            } catch (error) {
                console.error('Error loading data:', error);
                document.getElementById('error_messages').innerHTML = `<div class="alert alert-danger">Помилка: ${error.message}</div>`;
            }
        };

        // Обробка зміни селектора
        const operationTypeSelect = document.getElementById('operation_type');
        operationTypeSelect.addEventListener('change', (e) => {
            currentOperationType = e.target.value;
            console.log('Operation type changed to:', currentOperationType);
            loadData();
        });

        // Обробка фільтрів
        const filterInputs = ['party_name', 'payer_name', 'payment_amount', 'payment_operation_date'];
        filterInputs.forEach(id => {
            const input = document.getElementById(id);
            input.addEventListener('input', (e) => {
                filters[id] = e.target.value;
                console.log('Filter updated:', id, e.target.value);
                loadData();
            });
        });

        // Обробка вивантаження
        document.getElementById('download-btn').addEventListener('click', () => {
            const requestFilters = { operation_type: currentOperationType };
            Object.keys(filters).forEach(key => {
                if (filters[key]) requestFilters[key] = filters[key];
            });
            const url = `/api/v1/party/summary-info/download?filters=${encodeURIComponent(JSON.stringify(requestFilters))}`;
            window.location.href = url;
        });

        // Початкове завантаження
        loadData();
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
        background-color: #333;
        color: #fff;
    }
    .alert-danger {
        color: #721c24;
        background-color: #f8d7da;
        border-color: #f5c6cb;
        padding: 10px;
        margin-bottom: 15px;
    }
    .table {
        width: 100%;
        border-collapse: collapse;
    }
    .table th, .table td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
    }
    .table th {
        background-color: #f2f2f2;
        cursor: pointer;
    }
    .table th:hover {
        background-color: #e0e0e0;
    }
    .form-control {
        padding: 5px;
        margin: 5px 10px;
        width: 200px;
    }
    .filter-group {
        display: inline-block;
        margin-right: 20px;
    }
    .filter-group label {
        display: block;
        font-size: 14px;
    }
</style>