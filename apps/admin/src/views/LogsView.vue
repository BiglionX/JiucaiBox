<template>
  <div>
    <a-card>
      <div class="toolbar">
        <a-select v-model:value="limit" class="toolbar-select" :options="limitOptions" @change="load" />
        <a-button @click="load">
          <template #icon><ReloadOutlined /></template>
          刷新
        </a-button>
        <span class="toolbar-tip">仅超级管理员可查看操作日志</span>
      </div>

      <a-table
        :data-source="list"
        :columns="columns"
        :loading="loading"
        row-key="id"
        :pagination="pagination"
        @change="onTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'createdAt'">
            {{ formatDateTime(record.createdAt) }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-tag color="blue">{{ record.action }}</a-tag>
          </template>
          <template v-else-if="column.key === 'target'">
            <span v-if="record.target" class="mono">{{ record.target }}</span>
            <span v-else>-</span>
          </template>
          <template v-else-if="column.key === 'detail'">
            <a-tooltip :title="record.detail">
              <span class="ellipsis-cell">{{ record.detail || '-' }}</span>
            </a-tooltip>
          </template>
          <template v-else-if="column.key === 'ip'">
            <span class="mono">{{ record.ip || '-' }}</span>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ReloadOutlined } from '@ant-design/icons-vue';
import { fetchLogs, type OperationLogRow } from '@/api';
import { formatDateTime } from '@/utils/format';

const list = ref<OperationLogRow[]>([]);
const loading = ref(false);
const limit = ref(100);
const page = ref(1);
const pageSize = ref(20);

const limitOptions = [
  { label: '最近 50 条', value: 50 },
  { label: '最近 100 条', value: 100 },
  { label: '最近 200 条', value: 200 },
  { label: '最近 500 条', value: 500 },
];

const pagination = computed(() => ({
  current: page.value,
  pageSize: pageSize.value,
  total: list.value.length,
  showSizeChanger: true,
  showTotal: (t: number) => `共 ${t} 条`,
}));

const pageData = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  return list.value.slice(start, start + pageSize.value);
});

async function load() {
  loading.value = true;
  try {
    list.value = await fetchLogs(limit.value);
    page.value = 1;
  } finally {
    loading.value = false;
  }
}
onMounted(load);

function onTableChange(pag: { current?: number; pageSize?: number }) {
  page.value = pag.current || 1;
  pageSize.value = pag.pageSize || 20;
}

const columns = [
  { title: '时间', key: 'createdAt', width: 170 },
  { title: '操作人', dataIndex: 'adminName', width: 120 },
  { title: '动作', key: 'action', width: 130 },
  { title: '对象', key: 'target', width: 150 },
  { title: '详情', key: 'detail', ellipsis: true },
  { title: 'IP', key: 'ip', width: 140 },
];
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.toolbar-select {
  width: 150px;
}
.toolbar-tip {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}
.mono {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 12px;
}
.ellipsis-cell {
  display: inline-block;
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
}
</style>
