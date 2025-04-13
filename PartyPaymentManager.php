<?php declare(strict_types=1);

namespace App\Domains\Parties;

use App\Helpers\Filter\AmountFilterTrait;
use App\Helpers\Filter\DateFilterTrait;
use App\Models\Payment\PartyPaymentOperationModel;

class PartyPaymentManager extends \App\Libs\Yii\Db\Repository
{
    use AmountFilterTrait;
    use DateFilterTrait;

//    public string $modelClass = PaymentInfoModel::class;
    public string $modelClass = PartyPaymentOperationModel::class;

    public function __construct()
    {
        $this->attributesMap = [
            'party_name' => function($query, $params, $property, $value) {
                $query->joinWith('partyInfo');
                $query->andWhere(['is', 'parent_id', null]);
                return $query->andWhere(['ilike', 'name', $value]);
            },
            'party_code' => function($query, $params, $property, $value) {
                $query->joinWith('partyInfo');
                $query->andWhere(['is', 'parent_id', null]);
                return $query->andWhere(['ilike', 'code', $value]);
            },
            'office_name' => function($query, $params, $property, $value) {
                $query->joinWith('partyInfo');
                $query->andWhere(['is not', 'parent_id', null]);
                return $query->andWhere(['ilike', 'name', $value]);
            },
            'office_code' => function($query, $params, $property, $value) {
                $query->joinWith('partyInfo');
                $query->andWhere(['is not', 'parent_id', null]);
                return $query->andWhere(['ilike', 'code', $value]);
            },
            'payment_type' => ['ilike', 'payment_type'],
            'payment_operation_date' => function($query, $params, $property, $value) {
                return $this->addQueryFilterDateValue($query, $value, $property);
            },
            'payment_amount' => function($query, $params, $property, $value) {
                return $this->addQueryFilterAmountValue($query, $value, $property);
            },
            'payment_reason' => ['ilike', 'payment_reason'],
            'payment_purpose' => ['ilike', 'payment_purpose'],
            'payment_description' => ['ilike', 'payment_description'],
            'refund_date' => function($query, $params, $property, $value) {
                return $this->addQueryFilterDateValue($query, $value, $property);
            },
            'refund_amount' => function($query, $params, $property, $value) {
                return $this->addQueryFilterAmountValue($query, $value, $property);
            },
            'refund_budget_amount' => function($query, $params, $property, $value) {
                return $this->addQueryFilterAmountValue($query, $value, $property);
            },
            'refund_reason' => ['ilike', 'refund_reason'],
            'payer_type' => ['ilike', 'payer_type'],
            'payer_name' => ['ilike', 'payer_name'],
            'payer_code' => ['like', 'payer_code'],
            'payer_address' => ['ilike', 'payer_address'],
            'payer_bank_name' => ['ilike', 'payer_bank_name'],
            'payer_bank_code' => ['like', 'payer_bank_code'],
            'payer_account_type' => ['ilike', 'payer_account_type'],
            'payer_account_iban' => ['ilike', 'payer_account_iban'],
            'receiver_type' => ['ilike', 'receiver_type'],
            'receiver_name' => ['ilike', 'receiver_name'],
            'receiver_code' => ['like', 'receiver_code'],
            'receiver_address' => ['ilike', 'receiver_address'],
            'receiver_bank_name' => ['ilike', 'receiver_bank_name'],
            'receiver_bank_code' => ['like', 'receiver_bank_code'],
            'receiver_account_type' => ['ilike', 'receiver_account_type'],
            'receiver_account_iban' => ['ilike', 'receiver_account_iban'],
        ];

        $this->ordersMap = [
            'party_name' => function($query, $params, $property, $direction) {
                $query->joinWith('partyInfo');
//                $query->andWhere(['is', 'parent_id', null]);
                return ['code', $direction];
            },
            'party_code' => function($query, $params, $property, $direction) {
                $query->joinWith('partyInfo');
//                $query->andWhere(['is', 'parent_id', null]);
                return ['code', $direction];
            },
            'office_name' => function($query, $params, $property, $direction) {
                $query->joinWith('partyInfo');
//                $query->andWhere(['is not', 'parent_id', null]);
                return ['code', $direction];
            },
            'office_code' => function($query, $params, $property, $direction) {
                $query->joinWith('partyInfo');
//                $query->andWhere(['is not', 'parent_id', null]);
                return ['code', $direction];
            },
        //            'period_text' => function($query, $params, $property, $direction) {
        //                return $direction == 'asc' ? ['period_from', 'asc'] : ['period_till', 'desc'];
        //            },
        //            'report_type_text' => function($query, $params, $property, $direction) {
        //                return ['type_id', $direction];
        //            },
        //            'process_type_text' => function($query, $params, $property, $direction) {
        //                return ['process_id', $direction];
        //            },
        //            'status_text' => function($query, $params, $property, $direction) {
        //                return ['status_id', $direction];
        //            },
        //            'candidate_name' => function($query, $params, $property, $direction) {
        //                return ['candidate_name', $direction];
        //            },
        //            'manager_name' => function($query, $params, $property, $direction) {
        //                return ['manager_name', $direction];
        //            },
        ];
    }

    public function getSummaryInfo(array $params = [], bool $extend = false, bool $unlimit = false) : array
    {
        $directionMap = [
            'asc' => SORT_ASC,
            'desc' => SORT_DESC,
        ];

        $query = $this->modelClass::find();
        $query = $this->prepareFindQuery($query, 'all');

        $query->select('count(*) as count, sum(payment_amount) as payment_amount, sum(refund_amount) as refund_amount');

        if(!empty($params['filters'])) {
            if($extend){
                $query->where($params['filters']);
            }
            else {
                foreach($params['filters'] as $property => $value) {
                    if(empty($this->attributesMap[$property])) {
                        $query->andFilterWhere([$property => $value]);
                        continue;
                    }
                    if(is_callable($this->attributesMap[$property])) {
                        $query = call_user_func($this->attributesMap[$property], $query, $params, $property, $value);
                    }
                    else {
                        [$operand, $column] = $this->attributesMap[$property];
                        $query->andFilterWhere([$operand, $column, $value]);
                    }
                }
            }
        }

        if(!empty($params['order'])) {
            $order = [];
            foreach($params['order'] as $property => $direction) {
                $property = strtolower($property);
                $direction = strtolower($direction);

                if(!empty($this->ordersMap[$property])) {
                    if(is_callable($this->ordersMap[$property])) {
                        [$column, $direction] = call_user_func($this->ordersMap[$property], $query, $params, $property, $direction);
                    }
                    else {
                        $column = $this->ordersMap[$property];
                    }
                }
                else {
                    $column = $property;
                }

                $order[$column] = $directionMap[$direction];
            }
            if($order) {
                $query->orderBy($order);
            }
        }

        $page = $params['pager']['page'] ?? 1;
        $size = $params['pager']['size'] ?? 20;

        $page = max($page, 1);
        $size = max($size, 10);
        $size = $unlimit ? $size : min($size, 100);

        $query->limit($size);
        $query->offset(($page - 1) * $size);
        $query->asArray();

        $list = $query->one();

        return $list ?: [];
    }
}
