/**
 * 泪花（故事）状态：列表分页、分类筛选、抱抱
 */
import { ref } from 'vue';
import { defineStore } from 'pinia';
import type { StoryCategory, StoryItem } from '@jiucaibox/shared';
import { storyApi } from '@/api';

const PAGE_SIZE = 10;

export const useStoryStore = defineStore('story', () => {
  const stories = ref<StoryItem[]>([]);
  const loading = ref(false);
  const finished = ref(false);
  const page = ref(1);
  const category = ref<StoryCategory | 'all'>('all');

  async function fetchStories(
    nextCategory: StoryCategory | 'all' = category.value,
    nextPage = 1,
    append = false,
  ) {
    if (loading.value) return;
    loading.value = true;

    if (!append || nextCategory !== category.value) {
      category.value = nextCategory;
      page.value = 1;
      finished.value = false;
      stories.value = [];
    } else {
      page.value = nextPage;
    }

    try {
      const res = await storyApi.getStories({
        page: page.value,
        pageSize: PAGE_SIZE,
        ...(category.value !== 'all' ? { category: category.value } : {}),
      });
      const list = append ? [...stories.value, ...res.list] : res.list;
      stories.value = list;
      finished.value = list.length >= res.total;
    } finally {
      loading.value = false;
    }
  }

  /** 抱抱：调用接口成功后更新本地数据 */
  async function hug(storyId: number): Promise<boolean> {
    try {
      await storyApi.hugStory(storyId);
      const item = stories.value.find((s) => s.id === storyId);
      if (item) {
        item.hugCount += 1;
        item.hugged = true;
      }
      return true;
    } catch {
      return false;
    }
  }

  function reset() {
    stories.value = [];
    page.value = 1;
    finished.value = false;
    category.value = 'all';
  }

  return { stories, loading, finished, page, category, fetchStories, hug, reset };
});
