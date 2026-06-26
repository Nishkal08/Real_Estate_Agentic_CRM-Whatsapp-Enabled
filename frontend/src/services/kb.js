import api from './api';
import { mockKBDocuments } from '@/utils/mockData';

const DEMO_MODE = true;

export const kbService = {
  getDocuments: async () => {
    if (DEMO_MODE) {
      await new Promise((r) => setTimeout(r, 400));
      return mockKBDocuments;
    }
    const res = await api.get('/kb/documents');
    return res.data;
  },

  uploadDocument: async (file, onProgress) => {
    if (DEMO_MODE) {
      // Simulate progress
      for (let p = 0; p <= 100; p += 20) {
        await new Promise((r) => setTimeout(r, 200));
        if (onProgress) onProgress(p);
      }
      return {
        id: `doc_demo_${Date.now()}`,
        name: file.name,
        type: file.name.split('.').pop(),
        size: file.size,
        chunks: Math.floor(Math.random() * 30) + 5,
        status: 'ready',
        uploadedAt: new Date().toISOString(),
      };
    }
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/kb/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    });
    return res.data;
  },

  addUrl: async (url) => {
    if (DEMO_MODE) {
      await new Promise((r) => setTimeout(r, 1500));
      return {
        id: `doc_demo_${Date.now()}`,
        name: url,
        type: 'url',
        size: 0,
        chunks: Math.floor(Math.random() * 10) + 3,
        status: 'ready',
        uploadedAt: new Date().toISOString(),
        url,
      };
    }
    const res = await api.post('/kb/url', { url });
    return res.data;
  },

  deleteDocument: async (id) => {
    if (DEMO_MODE) {
      await new Promise((r) => setTimeout(r, 400));
      return { success: true };
    }
    const res = await api.delete(`/kb/documents/${id}`);
    return res.data;
  },
};
