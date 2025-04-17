<?php declare(strict_types=1);

namespace App\Controllers\Api\V1\Public\Party;

use App\Controllers\Api\ApiController;
use Yii;

class SummaryInfoController extends ApiController
{
    use \App\Libs\Yii\Traits\CrudControllerTrait;

    protected array $onlyActions = ['List', 'Download'];

    protected array $rules = [
        'List' => ['?', '@'],
        'Download' => ['?', '@'],
    ];

    protected array $partyCache = [];

    public function actionList()
    {
        $data = Yii::$app->getRequest()->post();
        $data['filters'] = array_filter($data['filters'] ?? []);
        $manager = Yii::$container->get('party.payment.manager');
        // Валідація operation_type
        $type = $data['filters']['operation_type'] ?? 'monetary_contributions';
        $typeMap = [
            'monetary_contributions' => '3_1',
            'other_contributions' => '3_2',
            'state_funding' => '3_3',
            'other_incomes' => '3_4',
            'budget_expenses' => '4_1',
            'outgoing_expenses' => '4_2',
            'return_expenses' => '4_3',
            'transfer_expenses' => '4_4',
        ];

        if (!isset($typeMap[$type])) {
            Yii::error('Invalid operation_type: ' . $type, __METHOD__);

            return [
                'code' => 1,
                'errors' => ['Невірний тип операції'],
            ];
        }

        $data['filters']['group_code'] = $typeMap[$type];
        unset($data['filters']['operation_type']);
        unset($data['filters']['pager']);
        // Обробка числових значень
        $numericFields = ['payment_amount', 'refund_amount', 'refund_budget_amount'];
        foreach ($numericFields as $field) {
            if (!empty($data['filters'][$field]) && is_string($data['filters'][$field])) {
                $data['filters'][$field] = str_replace(' ', '', $data['filters'][$field]);
            }
        }

        if (empty($data['order'])) {
            $data['order'] = [
                'party_name' => 'desc',
            ];
        }

        $officeMap = [
            'Центральний офіс' => 1,
            'Всі регіональні осередки' => 2,
            'Центральний офіс + Всі регіональні осередки' => 3,
        ];
        $officeType = isset($data['filters']['office_type']) ? $officeMap[$data['filters']['office_type']] : 3;
        unset($data['filters']['office_type']);
        [$list, $count] = $manager->find($data);

        $list = array_map(fn($item) => $this->normalizeModelToResponse($item, 'List', $officeType), $list);
        $list = array_filter($list);
        $list = array_values($list);
        $count = count($list);
        // Зведена інформація

        unset($data['order']);
//       $data['pager']['size'] = 10000;
//        $summary = $manager->getSummaryInfo($data, false, true);
        $summary = $manager->getCurrentSummaryInfo($data, false, false);
        $summary['count'] =  $count;


        $summary['payment_type'] = $this->getSummaryTypeName($type);
        $summary['payment_amount'] = !empty($summary['payment_amount']) ? number_format((float) $summary['payment_amount'], 2, ',', ' ') : '0,00';
        $summary['refund_amount'] = !empty($summary['refund_amount']) ? number_format((float) $summary['refund_amount'], 2, ',', ' ') : '0,00';

        if (Yii::$app->getRequest()->get('download')) {
            $data['download_file_type'] = 'csv';
            $data['download_file_name'] = 'party_summary_info_' . $type . '.csv';
            $fieldMap = $this->getFieldMap($typeMap[$type]);
            $data['columns'] = array_keys($fieldMap);
            $data['titles'] = array_values($fieldMap);
            [$list] = $manager->find($data);
            $list = array_map(fn($item) => $this->normalizeModelToResponse($item, 'Download', $officeType), $list);
            $list = array_filter($list);
            $list = array_values($list);

            return $this->_actionList($data, false, true, $list);
        }

        $response = [
            'results' => [
                'list' => $list,
                'count' => $count,
                'summary' => $summary,
            ],
        ];

        return $response;
    }

    /**
     * @param $string
     * @return string
     */
    public function replaceNumbersWithStars( string $string): string
    {
        return preg_replace('/\d/', '*', $string);
    }

    /**
     * @param array $data
     * @return array
     */
    public function replaceConfident(array $data): array
    {
        // Логіка для відображення (List, View тощо)
        $isConfident = $data['payer_type'] == 'Фізична особа' || strlen($data['payer_code'] ?: '') == 10;

        $confidentAttributes = [
            'payer_code',
            'payer_birthday',
            'payer_address',
            'payment_purpose',
        ];

        foreach ($confidentAttributes as $attribute) {
            if ($attribute == 'payment_purpose' && isset($data[$attribute]) ) {
                $data[$attribute] = $this->replaceNumbersWithStars($data[$attribute]);
            } else {
                $data[$attribute] = $isConfident ? '[конфіденційна інформація]' : $data[$attribute];
            }
        }

        $isConfidentReceiver = $data['receiver_type'] == 'Фізична особа' || strlen($data['receiver_code'] ?: '') == 10;
        $confidentAttributesReceiver = [
            'receiver_code',
            'receiver_birthday',
            'receiver_address',
        ];

        foreach ($confidentAttributesReceiver as $attribute) {
            $data[$attribute] = $isConfidentReceiver ? '[конфіденційна інформація]' : $data[$attribute];
        }

        return $data;
    }

    protected function normalizeModelToResponse($model, string $type, $officeType = 3)
    {
        $formatter = Yii::$app->getFormatter();
        $data = $model->getAttributes();
        $data = $this->replaceConfident($data);
        if ($officeType == 2 && $data['office_id'] === null) {
            return [];
        } elseif ($officeType == 1 && $data['office_id'] !== null) {
            return [];
        }

        // Форматування для відображення
        if ($type === 'List') {
            $data['payment_operation_date'] = !empty($data['payment_operation_date']) ? $formatter->asDate($data['payment_operation_date']) : '--';
            $data['refund_date'] = !empty($data['refund_date']) ? $formatter->asDate($data['refund_date']) : '--';
            $data['payment_amount'] = !empty($data['payment_amount']) ? number_format((float)$data['payment_amount'], 2, ',', ' ') : '--';
            $data['refund_amount'] = !empty($data['refund_amount']) ? number_format((float)$data['refund_amount'], 2, ',', ' ') : '--';
            $data['refund_budget_amount'] = !empty($data['refund_budget_amount']) ? number_format((float)$data['refund_budget_amount'], 2, ',', ' ') : '--';
        }

        // Додавання партії та осередку
        if ($model->getPartyId() && empty($this->partyCache[$model->getPartyId()])) {
            $this->partyCache[$model->getPartyId()] = $model->partyInfo;
        }
        if ($model->getOfficeId() && empty($this->partyCache[$model->getOfficeId()])) {
            $this->partyCache[$model->getOfficeId()] = $model->officeInfo;
        }

        $partyInfo = $model->getPartyId() ? $this->partyCache[$model->getPartyId()] : null;
        $officeInfo = $model->getOfficeId() ? $this->partyCache[$model->getOfficeId()] : null;

        $data['party_name'] = $partyInfo?->getName() ?: null;
        $data['party_code'] = $partyInfo?->getCode() ?: null;
        $data['office_name'] = $officeInfo?->getName() ?: null;
        $data['office_code'] = $officeInfo?->getCode() ?: null;

        // Форматування для завантаження
        if ($type === 'Download') {
            $map = $this->getFieldMap($model->getGroupCode());
            $values = [];
            foreach ($map as $attribute => $title) {
                $values[$attribute] = $data[$attribute] ?? '--';
            }
            $data = $values;
        }

        return $data;
    }

    protected function getSummaryTypeName(string $type): string
    {
        $summaryTypeMap = [
            'monetary_contributions' => 'Грошові внески',
            'other_contributions' => 'Інші внески',
            'state_funding' => 'Кошти державного фінансування',
            'other_incomes' => 'Інші надходження',
            'budget_expenses' => 'Платежі з окремого рахунку',
            'outgoing_expenses' => 'Платежі з інших рахунків',
            'return_expenses' => 'Повернення грошових внесків',
            'transfer_expenses' => 'Повернення інших внесків',
        ];
        return $summaryTypeMap[$type] ?? '--';
    }

    protected function getFieldMap(string $type): array
    {
        $commonFields = [
            'party_name' => 'Найменування політичної партії',
            'party_code' => 'ЄДРПОУ політичної партії',
            'office_name' => 'Найменування регіонального осередку',
            'office_code' => 'ЄДРПОУ регіонального осередку',
        ];

        switch ($type) {
            case '3_1':
                return array_merge($commonFields, [
                    'payer_type' => 'Тип особи, що здійснила внесок',
                    'payer_name' => 'ПІБ фізичної особи/ФОП/найменування юридичної особи, яка здійснила внесок',
                    'payer_code' => 'РНОКПП/серія та номер паспорта/номер ID-картки/ідентифікаційний код юридичної особи',
                    'payer_birthday' => 'Дата народження фізичної особи, яка здійснила внесок',
                    'payer_address' => 'Місце проживання/місцезнаходження особи, яка здійснила внесок',
                    'receiver_bank_name' => 'Найменування установи, в якій відкрито рахунок політичної партії/її місцевої організації',
                    'receiver_account_iban' => 'Номер рахунку політичної партії/місцевої організації',
                    'payment_operation_date' => 'Дата надання внеску',
                    'payment_amount' => 'Сума внеску',
                ]);
            case '3_2':
                return array_merge($commonFields, [
                    'payment_type' => 'Вид внеску',
                    'payment_description' => 'Опис внеску',
                    'payer_type' => 'Тип особи, що здійснила внесок',
                    'payer_name' => 'ПІБ фізичної особи/ФОП/найменування юридичної особи, яка здійснила внесок',
                    'payer_code' => 'РНОКПП/серія та номер паспорта/номер ID-картки/ідентифікаційний код юридичної особи',
                    'payer_birthday' => 'Дата народження фізичної особи, яка здійснила внесок',
                    'payer_address' => 'Місце проживання/місцезнаходження особи, яка здійснила внесок',
                    'payment_operation_date' => 'Дата надання внеску',
                    'payment_amount' => 'Вартість внеску',
                ]);
            case '3_3':
                return array_merge($commonFields, [
                    'payment_type' => 'Форма державного фінансування',
                    'receiver_bank_name' => 'Найменування установи, в якій відкрито рахунок політичної партії',
                    'receiver_account_iban' => 'Номер рахунку політичної партії',
                    'payment_operation_date' => 'Дата надходження',
                    'payment_amount' => 'Сума надходження',
                    'refund_date' => 'Дата повернення',
                    'refund_amount' => 'Сума повернення',
                ]);
            case '3_4':
                return array_merge($commonFields, [
                    'payment_type' => 'Вид надходження',
                    'payment_description' => 'Опис надходження',
                    'payer_type' => 'Тип особи',
                    'payer_name' => 'ПІБ фізичної особи/ФОП/найменування юридичної особи, яка здійснила внесок',
                    'payer_code' => 'РНОКПП/серія та номер паспорта/номер ID-картки/ідентифікаційний код юридичної особи',
                    'payment_operation_date' => 'Дата надходження',
                    'receiver_bank_name' => 'Найменування установи, в якій відкрито рахунок політичної партії/її місцевої організації',
                    'receiver_account_iban' => 'Номер рахунку політичної партії/місцевої організації',
                    'payment_amount' => 'Сума/вартість надходження',
                ]);
            case '4_1':
            case '4_2':
                return array_merge($commonFields, [
                    'payment_operation_date' => 'Дата здійснення платежу',
                    'receiver_account_iban' => 'Номер рахунку політичної партії/місцевої організації',
                    'payment_reason' => 'Підстава для здійснення платежу',
                    'receiver_type' => 'Тип особи',
                    'receiver_name' => 'ПІБ фізичної особи/ФОП/найменування юридичної особи, на користь якої здійснено платіж',
                    'receiver_code' => 'РНОКПП/серія та номер паспорта, номер ID-картки/ідентифікаційний код юридичної особи',
                    'payment_purpose' => 'Цільове призначення платежу',
                    'payment_amount' => 'Сума платежу',
                ]);
            case '4_3':
                return array_merge($commonFields, [
                    'receiver_bank_name' => 'Найменування установи, в якій відкрито рахунок політичної партії/її місцевої організації',
                    'payment_account_iban' => 'Номер рахунку',
                    'payment_operation_date' => 'Дата отримання',
                    'receiver_type' => 'Тип особи',
                    'receiver_name' => 'ПІБ фізичної особи/ФОП/найменування юридичної особи',
                    'receiver_code' => 'РНОКПП/серія та номер паспорта, номер ID-картки/ідентифікаційний код юридичної особи',
                    'payment_amount' => 'Сума',
                    'refund_date' => 'Повернення - Дата повернення/перерахування',
                    'payer_type' => 'Повернення - Тип особи',
                    'payer_name' => 'Повернення - ПІБ фізичної особи/ФОП/найменування юридичної особи',
                    'payer_code' => 'РНОКПП/серія та номер паспорта, номер ID-картки/ідентифікаційний код юридичної особи',
                    'refund_reason' => 'Обгрунтування повернення/перерахування внеску',
                    'refund_amount' => 'Сума/вартість повернення',
                    'refund_budget_amount' => 'Сума, що перераховується (повертається) до державного бюджету',
                ]);
            case '4_4':
                return array_merge($commonFields, [
                    'payment_type' => 'Вид внеску',
                    'payment_description' => 'Опис внеску',
                    'payment_operation_date' => 'Дата отримання внеску',
                    'receiver_type' => 'Тип особи',
                    'receiver_name' => 'ПІБ фізичної особи/ФОП/найменування юридичної особи',
                    'receiver_code' => 'РНОКПП/серія та номер паспорта, номер ID-картки/ідентифікаційний код юридичної особи',
                    'payment_amount' => 'Вартість внеску',
                    'refund_date' => 'Повернення - Дата повернення/перерахування',
                    'payer_type' => 'Повернення - Тип особи',
                    'payer_name' => 'Повернення - ПІБ фізичної особи/ФОП/найменування юридичної особи',
                    'payer_code' => 'РНОКПП/серія та номер паспорта, номер ID-картки/ідентифікаційний код юридичної особи',
                    'refund_reason' => 'Обгрунтування повернення/перерахування внеску',
                    'refund_amount' => 'Сума/вартість повернення',
                    'refund_budget_amount' => 'Сума, що перераховується (повертається) до державного бюджету',
                ]);
        }
        return $commonFields;
    }
}