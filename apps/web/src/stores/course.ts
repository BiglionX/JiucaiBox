/**
 * 课程状态：分类列表、分页、加载状态
 */
import { ref } from 'vue';
import { defineStore } from 'pinia';
import type { CourseCategory, CourseItem } from '@jiucaibox/shared';
import { courseApi } from '@/api';

const PAGE_SIZE = 10;

export const useCourseStore = defineStore('course', () => {
  const courses = ref<CourseItem[]>([]);
  const loading = ref(false);
  const finished = ref(false);
  const page = ref(1);
  const category = ref<CourseCategory | 'all'>('all');

  async function fetchCourses(nextCategory: CourseCategory | 'all' = category.value, append = false) {
    if (loading.value) return;
    loading.value = true;

    if (!append || nextCategory !== category.value) {
      // 切换分类或首次加载：重置
      category.value = nextCategory;
      page.value = 1;
      finished.value = false;
      courses.value = [];
    }

    try {
      const res = await courseApi.getCourses({
        page: page.value,
        pageSize: PAGE_SIZE,
        ...(nextCategory !== 'all' ? { category: nextCategory } : {}),
      });
      courses.value = append ? [...courses.value, ...res.list] : res.list;
      finished.value = courses.value.length >= res.total;
    } finally {
      loading.value = false;
    }
  }

  function reset() {
    courses.value = [];
    page.value = 1;
    finished.value = false;
    category.value = 'all';
  }

  return { courses, loading, finished, page, category, fetchCourses, reset };
});
