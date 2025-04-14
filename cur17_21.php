<?php declare(strict_types=1);

use yii\helpers\Html;
use App\Assets\DataTableVueAssets;

DataTableVueAssets::register($this);

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
                <!-- Вивантаження вбудовано в компонент -->
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

    <!-- Фільтр operation_type -->
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
    </div>

    <!-- Таблиця даних -->
    <div id="error_messages"></div>
    <div id="datatable"></div>
</div>

<script>
    // Ініціалізація
    const init = () => {
        console.log('Starting initialization...');

        // Перевірка наявності #datatable
        const datatableElement = document.getElementById('datatable');
        if (!datatableElement) {
            console.error('Element #datatable not found');
            const errorDiv = document.getElementById('error_messages');
            if (errorDiv) {
                errorDiv.innerHTML = '<div class="alert alert-danger">Помилка: елемент #datatable не знайдено</div>';
            }
            return;
        }

        // Перевірка підключення скрипта
        const scripts = document.getElementsByTagName('script');
        let jsLoaded = false;
        let jsPath = '';
        for (let script of scripts) {
            if (script.src.includes('index-vcsAY5z7.js')) {
                jsLoaded = true;
                jsPath = script.src;
                break;
            }
        }
        console.log('DataTableVueAssets JS included in DOM:', jsLoaded, 'Path:', jsPath);

        // Очищення кешу
        localStorage.removeItem('summary_info_ingoing');

        // Спрощена конфігурація
        const config = {
            requestUrl: '/api/v1/party/summary-info/list',
            downloadUrl: '/api/v1/party/summary-info/download',
            storageKey: 'summary_info_ingoing',
            columns: [
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
                { name: 'payment_amount', title: 'Сума внеску', visible: true, sortable: true },
            ],
            filters: [
                { name: 'party_name', type: 'string', title: 'Найменування політичної партії', visible: true },
                { name: 'party_code', type: 'string', title: 'ЄДРПОУ політичної партії', visible: true },
                { name: 'office_name', type: 'string', title: 'Найменування регіонального осередку', visible: true },
                { name: 'office_code', type: 'string', title: 'ЄДРПОУ регіонального осередку', visible: true },
                { name: 'payer_name', type: 'string', title: 'ПІБ/Найменування юридичної особи', visible: true },
                { name: 'payer_code', type: 'string', title: 'РНОКПП/ЄДРПОУ', visible: true },
                { name: 'payment_amount', type: 'string', title: 'Сума внеску', visible: true },
                { name: 'payment_operation_date', type: 'date_range', title: 'Дата надання внеску', visible: true },
            ],
            order: { payment_operation_date: 'desc' },
            requestParams: {
                filters: {
                    operation_type: 'monetary_contributions',
                },
                pager: { page: 1, size: 10 },
            },
            showDownload: true,
        };

        console.log('Initial config:', config);

        // Спрощена ініціалізація
        console.log('Triggering datatable:setConfig with config:', config);
        document.dispatchEvent(new CustomEvent('datatable:setConfig', { detail: config }));
    };

    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM fully loaded');
        init();
    });

    // Дебагінг виконання
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