let writeQueue: Promise<void> = Promise.resolve();

function readStoredValue<T>(key: string, fallback: T): T {
  let storedValue: string | null;

  try {
    storedValue = window.localStorage.getItem(key);
  } catch (error: unknown) {
    console.error(`Gagal membaca "${key}" dari localStorage:`, error);
    return fallback;
  }

  if (storedValue === null) return fallback;

  try {
    const value: unknown = JSON.parse(storedValue);
    if (!Array.isArray(value)) {
      throw new TypeError(`Data "${key}" harus berupa daftar.`);
    }
    return value as T;
  } catch (error: unknown) {
    console.error(`Data "${key}" tidak valid; menggunakan data awal:`, error);
    return fallback;
  }
}

export interface LocalStoreData<TProduct, TOrder, TUser> {
  products: TProduct[];
  orders: TOrder[];
  hiddenStockListIds: number[];
  users: TUser[];
}

export async function loadStoreData<TProduct, TOrder, TUser>(
  initialProducts: TProduct[],
  initialUsers: TUser[],
): Promise<LocalStoreData<TProduct, TOrder, TUser>> {
  return {
    products: readStoredValue("toko-pakaian:products", initialProducts),
    orders: readStoredValue("toko-pakaian:orders", []),
    hiddenStockListIds: readStoredValue("toko-pakaian:hidden-stock", []),
    users: readStoredValue("toko-pakaian:users", initialUsers),
  };
}

export function saveStoreData<TProduct, TOrder, TUser>(
  products: TProduct[],
  orders: TOrder[],
  hiddenStockListIds: number[],
  users: TUser[],
): Promise<void> {
  const save = async () => {
    window.localStorage.setItem("toko-pakaian:products", JSON.stringify(products));
    window.localStorage.setItem("toko-pakaian:orders", JSON.stringify(orders));
    window.localStorage.setItem(
      "toko-pakaian:hidden-stock",
      JSON.stringify(hiddenStockListIds),
    );
    window.localStorage.setItem("toko-pakaian:users", JSON.stringify(users));
  };

  writeQueue = writeQueue.then(save, save);
  return writeQueue;
}