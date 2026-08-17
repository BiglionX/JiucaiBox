<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { showConfirmDialog, showToast } from 'vant';
import { storyApi, userApi, type MyCommentItem, type UserInteractions } from '@/api';
import EmptyState from '@/components/EmptyState.vue';
import { formatDateTime } from '@/utils/format';

const router = useRouter();

const active = ref<'comments' | 'hugs'>('comments');
const data = ref<UserInteractions | null>(null);
const loading = ref(true);

async function load() {
  loading.value = true;
  try {
    data.value = await userApi.getInteractions();
  } catch {
    // 已提示
  } finally {
    loading.value = false;
  }
}

function goStory(storyId: number) {
  router.push(`/stories/${storyId}`);
}

async function removeComment(comment: MyCommentItem) {
  try {
    await showConfirmDialog({
      title: '删除评论',
      message: '确定删除这条评论吗？删除后不可恢复。',
      confirmButtonText: '删除',
      confirmButtonColor: '#F44336',
    });
  } catch {
    return;
  }
  try {
    await storyApi.deleteComment(comment.id);
    if (data.value) {
      data.value.comments = data.value.comments.filter((c) => c.id !== comment.id);
    }
    showToast('已删除');
  } catch {
    // 已提示
  }
}

onMounted(load);
</script>

<template>
  <van-nav-bar title="我的互动" left-arrow @click-left="router.back()" />

  <van-tabs v-model:active="active" sticky color="#4CAF50">
    <van-tab title="我的评论" name="comments" />
    <van-tab title="我的抱抱" name="hugs" />
  </van-tabs>

  <div class="page">
    <!-- 我的评论 -->
    <template v-if="active === 'comments'">
      <div v-if="data?.comments.length">
        <div v-for="comment in data.comments" :key="comment.id" class="card interact-item">
          <div class="interact-item__main pressable" @click="goStory(comment.storyId)">
            <div class="interact-item__content">{{ comment.content }}</div>
            <div class="interact-item__meta">
              <span class="text-aux">评论了《{{ comment.storyTitle }}》</span>
              <span class="text-aux">{{ formatDateTime(comment.createdAt) }}</span>
            </div>
          </div>
          <van-button
            size="mini"
            round
            plain
            type="danger"
            class="interact-item__del"
            @click="removeComment(comment)"
          >
            删除
          </van-button>
        </div>
      </div>
      <EmptyState
        v-else-if="!loading"
        text="还没有评论过"
        description="去泪花里给分享者一点鼓励吧"
      />
    </template>

    <!-- 我的抱抱 -->
    <template v-else>
      <div v-if="data?.hugs.length">
        <div
          v-for="hug in data.hugs"
          :key="hug.id"
          class="card interact-item pressable"
          @click="goStory(hug.storyId)"
        >
          <van-icon name="like" color="#F44336" size="18" />
          <div class="interact-item__main">
            <div class="interact-item__content">抱抱了《{{ hug.storyTitle }}》</div>
            <div class="text-aux">{{ formatDateTime(hug.createdAt) }}</div>
          </div>
          <van-icon name="arrow" color="#C8C9CC" size="14" />
        </div>
      </div>
      <EmptyState
        v-else-if="!loading"
        text="还没有抱抱过"
        description="去泪花里送出你的温暖吧"
      />
    </template>
  </div>
</template>

<style scoped>
.interact-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.interact-item__main {
  flex: 1;
  min-width: 0;
}

.interact-item__content {
  font-size: 14px;
  color: var(--text-main);
  line-height: 1.6;
  margin-bottom: 4px;
  word-break: break-word;
}

.interact-item__meta {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
