<template>
  <main class="page">
    <a-card class="hero-card" :bordered="false">
      <a-space direction="vertical" :size="12">
        <a-tag color="processing">🔗 APaaS iframe 链接生成器</a-tag>
        <h1>选择页面类型，填写地址和 ID，生成最终访问链接</h1>
      </a-space>
    </a-card>

    <a-card title="输入信息" class="section-card" :bordered="false">
      <a-form layout="vertical">
        <a-form-item label="页面类型">
          <a-row :gutter="12" class="type-grid">
            <a-col v-for="item in pageTypes" :key="item.value" :xs="24" :sm="12" :md="6">
              <a-card
                class="type-card"
                :class="{ active: currentType === item.value }"
                :bordered="true"
                hoverable
                @click="setType(item.value)">
                {{ item.label }}
              </a-card>
            </a-col>
          </a-row>
        </a-form-item>

        <a-form-item label="应用访问地址">
          <a-input v-model:value="form.appUrl" allow-clear />
        </a-form-item>

        <a-form-item label="xdaptoken">
          <a-input v-model:value="form.xdapToken" allow-clear placeholder="请输入 xdaptoken" />
        </a-form-item>

        <a-row :gutter="12" class="field-grid">
          <a-col v-for="field in currentFields" :key="field.id" :xs="24" :md="12">
            <a-form-item :label="field.required ? `${field.label}（必填）` : field.label">
              <a-textarea
                v-if="field.textarea"
                v-model:value="dynamicForm[field.id]"
                :auto-size="{ minRows: 3, maxRows: 6 }"
                :placeholder="field.placeholder || ''" />
              <a-input
                v-else
                v-model:value="dynamicForm[field.id]"
                allow-clear
                :placeholder="field.placeholder || ''" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-alert
          v-if="errorMessage"
          class="error-alert"
          type="error"
          show-icon
          :message="errorMessage" />

        <a-space class="actions">
          <a-button type="primary" :loading="loading" @click="generate">
            {{ loading ? '正在登录获取 token...' : '生成链接' }}
          </a-button>
          <a-button @click="resetAll">清空参数</a-button>
        </a-space>
      </a-form>
    </a-card>

    <a-card title="生成结果" class="section-card" :bordered="false">
      <a-space direction="vertical" :size="12" class="result-space">
        <div class="result-head">
          <strong>最终链接地址</strong>
          <a-button size="small" @click="copyFinalUrl">复制</a-button>
        </div>
        <pre class="url-box">{{ finalUrl }}</pre>
      </a-space>
    </a-card>
  </main>
</template>

<script setup>
import {
  Alert as AAlert,
  Button as AButton,
  Card as ACard,
  Col as ACol,
  Form as AForm,
  FormItem as AFormItem,
  Input as AInput,
  Row as ARow,
  Space as ASpace,
  Tag as ATag,
  Textarea as ATextarea,
  message,
} from 'ant-design-vue';
import { computed, reactive, ref } from 'vue';

const DEFAULT_FINAL_TEXT = '点击“生成链接”后显示';

const pageTypes = [
  { label: '列表页面', value: 'listPage' },
  { label: '新增页面', value: 'insertPage' },
  { label: '详情页面', value: 'pageDetail' },
  { label: '审批页面', value: 'approvePage' },
];

const fieldConfigs = {
  listPage: [
    { id: 'formId', label: 'formId', required: true, placeholder: '表单 ID' },
    { id: 'appId', label: 'appId', required: true, placeholder: '应用 ID' },
    { id: 'currentMenu', label: 'currentMenu', required: true, placeholder: '菜单 ID' },
    { id: 'title', label: 'title', required: false, placeholder: '页面标题，可选' },
  ],
  insertPage: [
    { id: 'formId', label: 'formId', required: true, placeholder: '表单 ID' },
    { id: 'appId', label: 'appId', required: true, placeholder: '应用 ID' },
    { id: 'title', label: 'title', required: false, placeholder: '页面标题，可选' },
  ],
  pageDetail: [
    { id: 'formId', label: 'formId', required: true, placeholder: '表单 ID' },
    { id: 'appId', label: 'appId', required: true, placeholder: '应用 ID' },
    { id: 'documentId', label: 'documentId', required: true, placeholder: '数据 ID' },
    { id: 'tabId', label: 'tabId', required: true, placeholder: 'tabId' },
    { id: 'currentMenu', label: 'currentMenu', required: false, placeholder: '菜单 ID，可选' },
    { id: 'title', label: 'title', required: false, placeholder: '页面标题，可选' },
    {
      id: 'documentIds',
      label: 'documentIds',
      required: false,
      placeholder: '上一页/下一页 ID，可选。支持 JSON 数组或逗号分隔',
      textarea: true,
    },
  ],
  approvePage: [
    { id: 'formId', label: 'formId', required: true, placeholder: '表单 ID' },
    { id: 'documentId', label: 'documentId', required: true, placeholder: '数据 ID' },
  ],
};

const currentType = ref('listPage');
const loading = ref(false);
const errorMessage = ref('');
const finalUrl = ref(DEFAULT_FINAL_TEXT);
const toastVisible = ref(false);
const toastMessage = ref('已复制');

const form = reactive({
  appUrl: '',
  xdapToken: '',
});

const dynamicForm = reactive({});
const currentFields = computed(() => fieldConfigs[currentType.value] || []);

function resetDynamicFields() {
  Object.keys(dynamicForm).forEach((key) => delete dynamicForm[key]);
  currentFields.value.forEach((field) => {
    dynamicForm[field.id] = '';
  });
}

function setType(type) {
  currentType.value = type;
  resetDynamicFields();
  finalUrl.value = DEFAULT_FINAL_TEXT;
  errorMessage.value = '';
}

function unicodeBase64Encode(str) {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(Number.parseInt(p1, 16))
    )
  );
}

function normalizeCallbackUrl(appUrl) {
  const rawUrl = appUrl.trim();
  if (!rawUrl) throw new Error('请填写应用访问地址');

  const url = rawUrl.replace(/\/+$/, '');

  if (url.endsWith('/callback/apaas/index.html')) {
    return url;
  }

  return `${url}/callback/apaas/index.html`;
}

function requiredFormValue(value, label) {
  const v = String(value || '').trim();
  if (!v) throw new Error(`请填写 ${label}`);
  return v;
}

function buildUrl(base, params) {
  const url = new URL(base, window.location.href);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

function value(id) {
  return String(dynamicForm[id] || '').trim();
}

function required(id, label) {
  return requiredFormValue(value(id), label);
}

function clean(obj) {
  Object.keys(obj).forEach((key) => {
    if (obj[key] === '' || obj[key] === undefined || obj[key] === null) delete obj[key];
  });
  return obj;
}

function parseDocumentIds(text) {
  const raw = text.trim();
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {}
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildState() {
  if (currentType.value === 'approvePage') {
    return {
      m1: {
        formId: required('formId', 'formId'),
        documentId: required('documentId', 'documentId'),
        readOnly: 'isApprove',
        module: 'approvePage',
      },
      client: 'pc',
    };
  }

  const m1 = {
    formId: required('formId', 'formId'),
    module: currentType.value,
    appId: required('appId', 'appId'),
    title: value('title'),
  };

  if (currentType.value === 'listPage') m1.currentMenu = required('currentMenu', 'currentMenu');

  if (currentType.value === 'pageDetail') {
    m1.currentMenu = value('currentMenu');
    m1.documentId = required('documentId', 'documentId');
    m1.tabId = required('tabId', 'tabId');
    const ids = parseDocumentIds(value('documentIds'));
    if (ids?.length) m1.documentIds = ids;
  }

  return { m1: clean(m1) };
}

async function generate() {
  errorMessage.value = '';
  try {
    loading.value = true;
    const appUrl = requiredFormValue(form.appUrl, '应用访问地址');
    const callbackUrl = normalizeCallbackUrl(appUrl);
    const stateBase64 = unicodeBase64Encode(JSON.stringify(buildState()));
    finalUrl.value = buildUrl(callbackUrl, {
      xdaptoken: form.xdapToken,
      state: stateBase64,
    });
  } catch (e) {
    errorMessage.value = e?.message || '生成链接失败';
  } finally {
    loading.value = false;
  }
}

async function copyFinalUrl() {
  if (!finalUrl.value || finalUrl.value === DEFAULT_FINAL_TEXT) {
    showToast('暂无链接可复制');
    return;
  }
  try {
    await navigator.clipboard.writeText(finalUrl.value);
  } catch {
    const temp = document.createElement('textarea');
    temp.value = finalUrl.value;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand('copy');
    temp.remove();
  }
  showToast('已复制');
}

function showToast(content) {
  toastMessage.value = content;
  toastVisible.value = false;
  message.success(content);
}

function resetAll() {
  form.appUrl = '';
  form.xdapToken = '';
  resetDynamicFields();
  finalUrl.value = DEFAULT_FINAL_TEXT;
  errorMessage.value = '';
}

resetDynamicFields();
</script>

<style scoped>
:global(*) {
  box-sizing: border-box;
}

:global(body) {
  margin: 0;
  min-height: 100vh;
  overflow-y: scroll;
  background:
    radial-gradient(circle at 8% 8%, rgba(32, 128, 240, 0.14), transparent 30%),
    radial-gradient(circle at 90% 0%, rgba(24, 160, 88, 0.12), transparent 28%), #f6f8fb;
}

.page {
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  padding: 38px 20px 54px;
}

.hero-card,
.section-card {
  border-radius: 24px;
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.08);
}

.hero-card {
  margin-bottom: 20px;
}

.section-card {
  margin-bottom: 20px;
}

h1 {
  font-size: 32px;
  line-height: 1.18;
  margin: 0;
  letter-spacing: -0.6px;
}

.type-grid,
.field-grid {
  width: 100%;
}

.type-card {
  text-align: center;
  cursor: pointer;
  border-radius: 14px;
  font-weight: 700;
  transition: all 0.18s ease;
  user-select: none;
}

.type-card :deep(.ant-card-body) {
  padding: 18px 12px;
}

.type-card.active {
  color: #1677ff;
  border-color: #1677ff;
  background: #e6f4ff;
  box-shadow: 0 0 0 3px rgba(22, 119, 255, 0.1);
}

.actions {
  margin-top: 20px;
}

.error-alert {
  margin-top: 10px;
}

.result-space {
  width: 100%;
}

.result-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.url-box {
  display: block;
  min-height: 92px;
  max-height: 260px;
  margin: 0;
  overflow: auto;
  padding: 16px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid #f0f0f0;
  word-break: break-all;
  white-space: pre-wrap;
  font-size: 13px;
  line-height: 1.75;
}

@media (max-width: 820px) {
  h1 {
    font-size: 27px;
  }
}
</style>
