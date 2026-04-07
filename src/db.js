import { openDB } from 'idb';

const DB_NAME = 'briodo-db';
const DB_VERSION = 1;
const STORE_TODOS = 'todos';
const STORE_HISTORY = 'history'; // 나중에 쓸 히스토리 저장소
const STORE_SYNC_QUEUE = 'syncQueue'; // 오프라인 시 저장해둘 큐

export async function initDB() {
  return await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_TODOS)) {
        db.createObjectStore(STORE_TODOS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_HISTORY)) {
        db.createObjectStore(STORE_HISTORY, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(STORE_SYNC_QUEUE)) {
        const queueStore = db.createObjectStore(STORE_SYNC_QUEUE, { keyPath: 'id', autoIncrement: true });
        queueStore.createIndex('action', 'action'); // add, update, delete
      }
    },
  });
}

export async function getLocalTodos() {
  const db = await initDB();
  return await db.getAll(STORE_TODOS);
}

export async function saveLocalTodo(todo) {
  const db = await initDB();
  await db.put(STORE_TODOS, todo);
}

export async function saveLocalTodosBatch(todos) {
  const db = await initDB();
  const tx = db.transaction(STORE_TODOS, 'readwrite');
  for (const todo of todos) {
    tx.store.put(todo);
  }
  await tx.done;
}

export async function deleteLocalTodo(id) {
  const db = await initDB();
  await db.delete(STORE_TODOS, id);
}

// 오프라인 작업 큐
export async function addSyncQueue(action, todoId, metadata = {}) {
  const db = await initDB();
  await db.put(STORE_SYNC_QUEUE, { action, todoId, ...metadata, timestamp: Date.now() });
}

export async function getSyncQueue() {
  const db = await initDB();
  return await db.getAll(STORE_SYNC_QUEUE);
}

export async function clearSyncQueue(id) {
  const db = await initDB();
  await db.delete(STORE_SYNC_QUEUE, id);
}
