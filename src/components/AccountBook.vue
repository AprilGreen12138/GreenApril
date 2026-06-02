<template>
  <div class="account-page">
    <!-- 资产总览 -->
    <section class="summary-card">
      <div class="summary-row summary-row-only">
        <div>
          <span>累计收入</span>
          <strong class="income">+ ¥ {{ totalSummary.income.toFixed(2) }}</strong>
        </div>

        <div>
          <span>累计支出</span>
          <strong class="expense">- ¥ {{ totalSummary.expense.toFixed(2) }}</strong>
        </div>
      </div>
    </section>

    <!-- 年月统计 -->
    <section class="period-card">
      <div class="period-header">
        <div>
          <h3>阶段统计</h3>
          <p>{{ periodTitle }}收支汇总</p>
        </div>

        <div class="period-switch">
          <button :class="{ active: periodMode === 'year' }" @click="periodMode = 'year'">
            年
          </button>
          <button :class="{ active: periodMode === 'month' }" @click="periodMode = 'month'">
            月
          </button>
        </div>
      </div>

      <div class="period-filter">
        <label v-if="periodMode === 'year'">
          <span>选择年份</span>
          <select v-model="selectedYear">
            <option v-for="year in yearOptions" :key="year" :value="year">{{ year }} 年</option>
          </select>
        </label>

        <label v-else>
          <span>选择月份</span>
          <input v-model="selectedMonth" type="month" />
        </label>
      </div>

      <div class="period-summary">
        <div>
          <span>{{ periodTitle }}收入</span>
          <strong class="income">¥ {{ activePeriodSummary.income.toFixed(2) }}</strong>
        </div>

        <div>
          <span>{{ periodTitle }}支出</span>
          <strong class="expense">¥ {{ activePeriodSummary.expense.toFixed(2) }}</strong>
        </div>
      </div>
    </section>

    <!-- 快速记账 -->
    <section class="form-card">
      <div class="type-tabs">
        <button :class="{ active: form.type === 'expense' }" @click="form.type = 'expense'">
          支出
        </button>
        <button :class="{ active: form.type === 'income' }" @click="form.type = 'income'">
          收入
        </button>
      </div>

      <div class="amount-input">
        <span>¥</span>
        <input v-model.number="form.amount" type="number" placeholder="0.00" />
      </div>

      <div class="category-grid">
        <button
          v-for="item in currentCategories"
          :key="item.name"
          :class="{ selected: form.category === item.name }"
          @click="form.category = item.name">
          <span class="category-icon">{{ item.icon }}</span>
          <span>{{ item.name }}</span>
        </button>
      </div>

      <input v-model="form.date" class="date-input" type="date" />

      <input
        v-model="form.remark"
        class="remark-input"
        placeholder="备注，例如：午餐、打车、奶茶" />

      <button class="submit-btn" :disabled="loading" @click="addRecord">
        {{ loading ? '保存中...' : '记一笔' }}
      </button>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { supabase } from '../lib/supabase';
const loading = ref(false);

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function getCurrentMonth() {
  return getToday().slice(0, 7);
}

const selectedYear = ref(new Date().getFullYear());
const selectedMonth = ref(getCurrentMonth());
const periodMode = ref('month');

const expenseCategories = [
  { name: '餐饮', icon: '🍜' },
  { name: '零食饮料', icon: '🥤' },
  { name: '买菜', icon: '🥬' },
  { name: '交通出行', icon: '🚇' },
  { name: '打车', icon: '🚕' },
  { name: '购物消费', icon: '🛍️' },
  { name: '服饰鞋包', icon: '👕' },
  { name: '日用百货', icon: '🧻' },
  { name: '居家住房', icon: '🏠' },
  { name: '水电煤气', icon: '💡' },
  { name: '通讯网络', icon: '📱' },
  { name: '医疗健康', icon: '💊' },
  { name: '运动健身', icon: '🏃' },
  { name: '娱乐休闲', icon: '🎮' },
  { name: '旅游度假', icon: '✈️' },
  { name: '学习教育', icon: '📚' },
  { name: '人情社交', icon: '🎁' },
  { name: '宠物', icon: '🐶' },
  { name: '数码电器', icon: '💻' },
  { name: '其他支出', icon: '🧾' },
];

const incomeCategories = [
  { name: '工资', icon: '💰' },
  { name: '奖金', icon: '🎁' },
  { name: '兼职副业', icon: '💼' },
  { name: '理财收益', icon: '📈' },
  { name: '红包转账', icon: '🧧' },
  { name: '报销', icon: '🧾' },
  { name: '退款', icon: '↩️' },
  { name: '收款', icon: '💳' },
  { name: '租金收入', icon: '🏘️' },
  { name: '其他收入', icon: '✨' },
];

const form = reactive({
  type: 'expense',
  amount: '',
  category: '餐饮',
  remark: '',
  date: getToday(),
});

const records = ref([]);

const currentCategories = computed(() => {
  return form.type === 'expense' ? expenseCategories : incomeCategories;
});

watch(
  () => form.type,
  () => {
    form.category = currentCategories.value[0]?.name || '';
  }
);

function calcSummary(list) {
  return list.reduce(
    (result, item) => {
      const amount = Number(item.amount) || 0;

      if (item.type === 'income') {
        result.income += amount;
      }

      if (item.type === 'expense') {
        result.expense += amount;
      }

      return result;
    },
    {
      income: 0,
      expense: 0,
    }
  );
}

const totalSummary = computed(() => {
  return calcSummary(records.value);
});

const yearSummary = computed(() => {
  const list = records.value.filter((item) => {
    return new Date(item.date).getFullYear() === Number(selectedYear.value);
  });

  return calcSummary(list);
});

const monthSummary = computed(() => {
  const list = records.value.filter((item) => {
    return item.date.slice(0, 7) === selectedMonth.value;
  });

  return calcSummary(list);
});

const yearOptions = computed(() => {
  const startYear = 2025;
  const currentYear = new Date().getFullYear();
  const endYear = Math.max(startYear, currentYear);

  return Array.from({ length: endYear - startYear + 1 }, (_, index) => endYear - index);
});

const activePeriodSummary = computed(() => {
  return periodMode.value === 'year' ? yearSummary.value : monthSummary.value;
});

const periodTitle = computed(() => {
  return periodMode.value === 'year' ? `${selectedYear.value} 年` : `${selectedMonth.value} `;
});

async function fetchRecords() {
  loading.value = true;

  try {
    const { data, error } = await supabase
      .from('account_records')
      .select('*')
      .order('record_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    records.value = (data || []).map((item) => ({
      id: item.id,
      type: item.type,
      category: item.category,
      amount: Number(item.amount),
      remark: item.remark || '',
      date: item.record_date,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  } catch (error) {
    console.error(error);
    alert(error.message || '查询账单失败');
  } finally {
    loading.value = false;
  }
}

async function addRecord() {
  if (loading.value) {
    return;
  }

  if (!form.amount || Number(form.amount) <= 0) {
    alert('请输入正确金额');
    return;
  }

  if (!form.category) {
    alert('请选择分类');
    return;
  }

  const payload = {
    type: form.type,
    category: form.category,
    amount: Number(form.amount),
    remark: form.remark,
    date: form.date || getToday(),
  };

  loading.value = true;

  try {
    const { data, error } = await supabase
      .from('account_records')
      .insert({
        type: payload.type,
        category: payload.category,
        amount: payload.amount,
        remark: payload.remark,
        record_date: payload.date,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    records.value.unshift({
      id: data.id,
      type: data.type,
      category: data.category,
      amount: Number(data.amount),
      remark: data.remark || '',
      date: data.record_date,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });

    form.amount = '';
    form.remark = '';
    form.date = getToday();
  } catch (error) {
    console.error(error);
    alert(error.message || '新增账单失败');
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchRecords();
});
</script>

<style scoped>
.account-page {
  min-height: 100vh;
  padding: 24px;
  background: #f6f7fb;
  color: #1f2937;
  box-sizing: border-box;
}

.summary-card,
.period-card,
.form-card {
  background: #fff;
  border-radius: 22px;
  padding: 20px;
  margin-bottom: 18px;
  box-shadow: 0 12px 30px rgba(31, 41, 55, 0.06);
}

.summary-card {
  background: linear-gradient(135deg, #4f7cff, #6c63ff);
  color: #fff;
}

.summary-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 20px;
}

.summary-row-only {
  margin-top: 0;
}

.summary-row div {
  padding: 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.16);
}

.summary-row span {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  opacity: 0.8;
}

.summary-row strong {
  font-size: 18px;
}

.period-card {
  background: #fff;
}

.period-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 16px;
}

.period-header h3 {
  margin: 0;
  font-size: 18px;
}

.period-header p {
  margin: 6px 0 0;
  color: #8a8f9c;
  font-size: 13px;
}

.period-switch {
  display: flex;
  flex-shrink: 0;
  padding: 4px;
  border-radius: 14px;
  background: #f1f3f8;
}

.period-switch button {
  min-width: 54px;
  height: 36px;
  border: none;
  border-radius: 11px;
  background: transparent;
  color: #6b7280;
  font-size: 14px;
  cursor: pointer;
}

.period-switch button.active {
  background: #fff;
  color: #4f7cff;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(31, 41, 55, 0.08);
}

.period-filter {
  margin-bottom: 14px;
}

.period-filter label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #6b7280;
  font-size: 13px;
}

.period-filter select,
.period-filter input {
  width: 100%;
  height: 44px;
  padding: 0 14px;
  border: none;
  outline: none;
  border-radius: 14px;
  background: #f8fafc;
  color: #1f2937;
  font-size: 14px;
  box-sizing: border-box;
}

.period-summary {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.period-summary div {
  padding: 16px;
  border-radius: 16px;
  background: #f8fafc;
}

.period-summary span {
  display: block;
  margin-bottom: 8px;
  color: #8a8f9c;
  font-size: 13px;
}

.period-summary strong {
  font-size: 20px;
}

.type-tabs {
  display: flex;
  padding: 4px;
  margin-bottom: 16px;
  border-radius: 14px;
  background: #f1f3f8;
}

.type-tabs button {
  flex: 1;
  height: 40px;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: #6b7280;
  font-size: 15px;
  cursor: pointer;
}

.type-tabs button.active {
  background: #fff;
  color: #4f7cff;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(31, 41, 55, 0.08);
}

.amount-input {
  display: flex;
  align-items: center;
  height: 58px;
  padding: 0 16px;
  margin-bottom: 16px;
  border-radius: 16px;
  background: #f8fafc;
}

.amount-input span {
  font-size: 24px;
  font-weight: 700;
  color: #4f7cff;
}

.amount-input input {
  flex: 1;
  border: none;
  outline: none;
  margin-left: 10px;
  background: transparent;
  font-size: 28px;
  font-weight: 700;
}

.amount-input input::-webkit-outer-spin-button,
.amount-input input::-webkit-inner-spin-button {
  margin: 0;
  appearance: none;
}

.amount-input input[type='number'] {
  appearance: textfield;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  max-height: 252px;
  padding-right: 4px;
  overflow-y: auto;
}

.category-grid button {
  height: 76px;
  border: 1px solid transparent;
  border-radius: 16px;
  background: #f8fafc;
  color: #374151;
  cursor: pointer;
  transition: 0.2s;
}

.category-grid button:hover {
  transform: translateY(-2px);
}

.category-grid button.selected {
  border-color: #4f7cff;
  background: #eef4ff;
  color: #4f7cff;
}

.category-grid button span:last-child {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}

.category-icon {
  display: block;
  margin-bottom: 6px;
  font-size: 24px;
}

.date-input,
.remark-input {
  width: 100%;
  height: 46px;
  margin-top: 14px;
  padding: 0 14px;
  border: none;
  outline: none;
  border-radius: 14px;
  background: #f8fafc;
  font-size: 14px;
  box-sizing: border-box;
}

.date-input {
  height: 42px;
  padding: 0 12px;
  background: #f8fafc;
  color: #1f2937;
  font-size: 14px;
  box-sizing: border-box;
}

.submit-btn {
  width: 100%;
  height: 48px;
  margin-top: 14px;
  border: none;
  border-radius: 16px;
  background: #4f7cff;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
}

.submit-btn:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

@media (max-width: 600px) {
  .account-page {
    padding: 16px;
  }

  .category-grid {
    grid-template-columns: repeat(3, 1fr);
    max-height: 344px;
  }

  .period-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .period-switch {
    width: 100%;
  }

  .period-switch button {
    flex: 1;
  }

  .period-summary {
    grid-template-columns: 1fr;
  }
}
</style>
