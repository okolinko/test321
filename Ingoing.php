<?php declare(strict_types=1);

use yii\helpers\Html;

App\Assets\DataTableVueAssets::register($this);
Yii::$app->params['pageTitle'] = 'Зведена інформація - Внески';
Yii::$app->params['pageSubtitle'] = 'Перегляд внесків';
Yii::$app->params['pageHeader'] = Yii::$app->params['pageSubtitle'];
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
                <th>Тип внеску</th>
                <th>Кількість</th>
                <th>Сума платежу</th>
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
                        <option value="monetary_contributions" selected>Грошові внески</option>
                        <option value="other_contributions">Інші внески</option>
                        <option value="state_funding" >Кошти державного фінансування</option>
                        <option value="other_incomes">Інші надходження</option>
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
<!--{ name: 'party_type', title: 'Тип офісу', visible: false, sortable: false, value: (data) => data.party.is_offce ? 'регіональний' : 'центральний' },-->

<script>

    // Конфігурація колонок
    const tableColumns = {
        monetary_contributions: [
            { name: 'party_name', title: 'Найменування політичної партії', visible: true, sortable: true },
            { name: 'party_code', title: 'ЄДРПОУ політичної партії', visible: true, sortable: true },
            { name: 'office_name', title: 'Найменування регіонального осередку', visible: true, sortable: true },
            { name: 'office_code', title: 'ЄДРПОУ регіонального осередку', visible: true, sortable: true },
            { name: 'payer_name', title: 'ПІБ/найменування юридичної особи', visible: true, sortable: true },
            { name: 'payer_code', title: 'РНОКПП/ЄДРПОУ', visible: true, sortable: true },
            { name: 'payer_type', title: 'Тип особи', visible: true, sortable: true },
            { name: 'payer_birthday', title: 'Дата народження', visible: true, sortable: true },
            { name: 'payer_address', title: 'Місце проживання', visible: true, sortable: true },
            { name: 'receiver_bank_name', title: 'Назва банку', visible: true, sortable: true },
            { name: 'receiver_account_iban', title: 'Номер рахунку', visible: true, sortable: true },
            { name: 'payment_operation_date', title: 'Дата внеску', visible: true, sortable: true },
            { name: 'payment_amount',  title: 'Сума платежу', visible: true, sortable: true},
        ],
        other_contributions: [
            { name: 'party_name', title: 'Найменування політичної партії', visible: true, sortable: true },
            { name: 'party_code', title: 'ЄДРПОУ політичної партії', visible: true, sortable: true },
            { name: 'office_name', title: 'Найменування регіонального осередку', visible: true, sortable: true },
            { name: 'office_code', title: 'ЄДРПОУ регіонального осередку', visible: true, sortable: true },
            { name: 'payment_type', title: 'Вид внеску', visible: true, sortable: true },
            { name: 'payer_name', title: 'ПІБ/найменування юридичної особи', visible: true, sortable: true },
            { name: 'payer_code', title: 'РНОКПП/ЄДРПОУ', visible: true, sortable: true },
            { name: 'payer_type', title: 'Тип особи', visible: true, sortable: true },
            { name: 'payer_birthday', title: 'Дата народження', visible: true, sortable: true },
            { name: 'payer_address', title: 'Місце проживання', visible: true, sortable: true },
            { name: 'payment_operation_date', title: 'Дата внеску', visible: true, sortable: true },
            { name: 'payment_amount', title: 'Сума платежу', visible: true, sortable: true },
        ],
        state_funding: [
            { name: 'party_name', title: 'Найменування політичної партії', visible: true, sortable: true },
            { name: 'party_code', title: 'ЄДРПОУ політичної партії', visible: true, sortable: true },
            { name: 'office_name', title: 'Найменування регіонального осередку', visible: true, sortable: true },
            { name: 'office_code', title: 'ЄДРПОУ регіонального осередку', visible: true, sortable: true },
            { name: 'payment_type', title: 'Форма фінансування', visible: true, sortable: true },
            { name: 'receiver_bank_name', title: 'Назва банку', visible: true, sortable: true },
            { name: 'receiver_account_iban', title: 'Номер рахунку', visible: true, sortable: true },
            { name: 'payment_operation_date', title: 'Дата надходження', visible: true, sortable: true },
            { name: 'refund_amount', title: 'Сума повернення', visible: true, sortable: true },
            { name: 'payment_amount', title: 'Сума платежу', visible: true, sortable: true },
            { name: 'refund_amount', title: 'Сума повернення', visible: true, sortable: true },
        ],
        other_incomes: [
            { name: 'party_name', title: 'Найменування політичної партії', visible: true, sortable: true },
            { name: 'party_code', title: 'ЄДРПОУ політичної партії', visible: true, sortable: true },
            { name: 'office_name', title: 'Найменування регіонального осередку', visible: true, sortable: true },
            { name: 'office_code', title: 'ЄДРПОУ регіонального осередку', visible: true, sortable: true },
            { name: 'payment_type', title: 'Вид надходження', visible: true, sortable: true },
            { name: 'payment_description', title: 'Опис надходження', visible: true, sortable: true },
            { name: 'payer_name', title: 'ПІБ/найменування юридичної особи', visible: true, sortable: true },
            { name: 'payer_type', title: 'Тип особи', visible: true, sortable: true },
            { name: 'payment_operation_date', title: 'Дата надходження', visible: true, sortable: true },
            { name: 'receiver_bank_name', title: 'Назва банку', visible: true, sortable: true },
            { name: 'receiver_account_iban', title: 'Номер рахунку', visible: true, sortable: true },
            { name: 'payment_amount', title: 'Сума платежу', visible: true, sortable: true },
        ],
    };

    // Конфігурація фільтрів
    const tableFilters = {
        monetary_contributions: [
            // { name: 'office_type', type: 'string', title: 'тип', visible: false },
            { name: 'party_name', type: 'string', title: 'Найменування політичної партії', visible: true },
            { name: 'party_code', type: 'string', title: 'ЄДРПОУ політичної партії', visible: true },
            { name: 'office_name', type: 'string', title: 'Найменування регіонального осередку', visible: true },
            { name: 'office_code', type: 'string', title: 'ЄДРПОУ регіонального осередку', visible: true },
            { name: 'payer_name', type: 'string', title: 'ПІБ/Найменування юридичної особи', visible: true },
            { name: 'payer_code', type: 'string', title: 'РНОКПП/ЄДРПОУ', visible: true },
            { name: 'payment_amount', type: 'string', title: 'Сума платежу', visible: true },
            { name: 'payment_operation_date', type: 'date_range', title: 'Дата надання внеску', visible: true },
            { name: 'receiver_account_iban', type: 'string', title: 'Номер рахунку', visible: true },
        ],
        other_contributions: [
            // { name: 'office_type', type: 'string', title: 'тип', visible: false },
            { name: 'party_name', type: 'string', title: 'Найменування політичної партії', visible: true },
            { name: 'party_code', type: 'string', title: 'ЄДРПОУ політичної партії', visible: true },
            { name: 'office_name', type: 'string', title: 'Найменування регіонального осередку', visible: true },
            { name: 'office_code', type: 'string', title: 'ЄДРПОУ регіонального осередку', visible: true },
            { name: 'payer_name', type: 'string', title: 'ПІБ/Найменування юридичної особи', visible: true },
            { name: 'payer_code', type: 'string', title: 'РНОКПП/ЄДРПОУ', visible: true },
            { name: 'payment_amount', type: 'string', title: 'Сума платежу', visible: true },
            { name: 'payment_operation_date', type: 'date_range', title: 'Дата надання внеску', visible: true },
        ],
        state_funding: [
            // { name: 'office_type', type: 'string', title: 'тип', visible: false },
            { name: 'party_name', type: 'string', title: 'Найменування політичної партії', visible: true },
            { name: 'party_code', type: 'string', title: 'ЄДРПОУ політичної партії', visible: true },
            { name: 'office_name', type: 'string', title: 'Найменування регіонального осередку', visible: true },
            { name: 'office_code', type: 'string', title: 'ЄДРПОУ регіонального осередку', visible: true },
            { name: 'payment_amount', type: 'string', title: 'Сума платежу', visible: true },
            { name: 'payment_operation_date', type: 'date_range', title: 'Дата надходження', visible: true },
        ],
        other_incomes: [
            // { name: 'office_type', type: 'string', title: 'тип', visible: false },
            { name: 'party_name', type: 'string', title: 'Найменування політичної партії', visible: true },
            { name: 'party_code', type: 'string', title: 'ЄДРПОУ політичної партії', visible: true },
            { name: 'office_name', type: 'string', title: 'Найменування регіонального осередку', visible: true },
            { name: 'office_code', type: 'string', title: 'ЄДРПОУ регіонального осередку', visible: true },
            { name: 'payer_name', type: 'string', title: 'ПІБ/Найменування юридичної особи', visible: true },
            { name: 'payer_code', type: 'string', title: 'РНОКПП/ЄДРПОУ', visible: true },
            { name: 'payment_amount', type: 'string', title: 'Сума платежу', visible: true },
            { name: 'payment_operation_date', type: 'date_range', title: 'Дата надходження', visible: true },
        ],
    };

    // Ініціалізація
    const init = (currentOperationType) => {
        // console.log('init start: ', currentOperationType);
        // Очищення кешу
        localStorage.removeItem('summary_info_ingoing');
        localStorage.removeItem('summary_info_outgoing');
        // console.log('Starting initialization...');
        // Перевірка наявності #datatable
        let datatableElement = document.getElementById('datatable');
        if (!datatableElement) {
            const errorDiv = document.getElementById('error_messages');
            if (errorDiv) {
                errorDiv.innerHTML = '<div class="alert alert-danger">Помилка: елемент #datatable не знайдено</div>';
            }
        }

        if (!currentOperationType) {
            currentOperationType = 'monetary_contributions';
        }
        // console.log('init start set: ', currentOperationType);
        // Дебагінг скриптів
        // console.log('Scripts loaded:', Array.from(document.getElementsByTagName('script')).map(s => s.src));

        // let currentOperationType = 'monetary_contributions';
        let officeTypeSelect = document.getElementById('office-type-select');
        const getOfficeType = () => officeTypeSelect.value;

        const getConfig = () => (
            {
            requestUrl: '/api/v1/party/summary-info/list',
            storageKey: 'summary_info_ingoing',
            columns: tableColumns[currentOperationType],
            filters: tableFilters[currentOperationType],
            order: { party_name: 'desc' },
            requestParams: {
                group_code: currentOperationType,
                operation_type: currentOperationType,
                pager: { page: 1, size: 20 },
                office_type: getOfficeType(),
            },

            showDownload: true,
        });


        const config = getConfig();
        // console.log('Initial config:', config);

        const updateSummary = (summary) => {
            // console.log('Updating summary:', summary);
            const row = document.querySelector('#summary_info_table tbody tr');
            // console.log('Summary table row:', row);
            if (row) {
                // console.log('SUMMARY - VIEW:', summary);
                // console.log('Setting payment_type:', summary?.payment_type || 'Немає даних');
                // console.log('Setting count:', summary?.count || '0');
                // console.log('Setting payment_amount:', summary?.payment_amount || '0,00');
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
                // console.error('Column "Сума надходження" not found');
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
            rowSumary.querySelector('[name="current_summary_info_summ"]').textContent = formattedSum || '0,00';
        };

        document.addEventListener('datatable:dataLoaded', (e) => {
            // Очищення кешу
            localStorage.removeItem('summary_info_ingoing');
            localStorage.removeItem('summary_info_outgoing');
            let data = e.detail;
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
            // document.dispatchEvent(new CustomEvent('datatable:filterUpdate', { detail: e } ));
            // Виклик парсингу після оновлення таблиці
            setTimeout(parsePaymentAmounts, 500); // Затримка для рендерингу

        });

        // Обробка зміни operation_type
        const operationTypeSelect = document.getElementById('operation_type');
        // console.log('tyt');
        operationTypeSelect.addEventListener('change', (e) => {
            localStorage.removeItem('summary_info_ingoing');
            currentOperationType = e.target.value;
            // console.log('tyt e:', e.target.value);
            // console.log('Switching to operation_type:', currentOperationType);
            let config = getConfig();
            // console.log('New config:', config);
            document.dispatchEvent(new CustomEvent('datatable:setConfig', { detail: config }));
            // document.dispatchEvent(new CustomEvent('datatable:reload'));

            // setTimeout(parsePaymentAmounts, 500); // Затримка для рендерингу
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
            let config = getConfig();
            // document.dispatchEvent(new CustomEvent('datatable:setConfig', { detail: config }));
            // if (e.detail?.filter?.name === 'payment_amount') {
            //     e.detail.filter.value = e.detail.filter.value.replace(/[\s,]/g, '');
            //     console.log('Cleaned payment_amount:', e.detail.filter.value);
            // }
            // setTimeout(parsePaymentAmounts, 500); // Затримка для рендерингу
        });

        // Ініціалізація

        // Оновлення даних при зміні office_type
        officeTypeSelect.addEventListener('change', () => {
            // console.log('change');
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
        // console.log('Old config:', config);
        document.dispatchEvent(new CustomEvent('datatable:setConfig', {detail: config}));
        // document.dispatchEvent(new CustomEvent('datatable:reload'));
    };

    document.addEventListener('DOMContentLoaded', () => {
        // console.log('DOM fully loaded');
        init();
    });
    window.addEventListener('load', () => {
        // console.log(document.getElementById('datatable'));
        // console.log(document);
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