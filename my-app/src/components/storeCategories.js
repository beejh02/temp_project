const DEFAULT_CATEGORY = {
  code: "DEFAULT",
  name: "점포",
  iconId: "store-icon-store",
  color: "#495467",
};

const STORE_CATEGORIES = {
  I2: {
    code: "I2",
    name: "음식",
    iconId: "store-icon-food",
    color: "#f06455",
  },
  G2: {
    code: "G2",
    name: "소매",
    iconId: "store-icon-retail",
    color: "#7b61d1",
  },
  S2: {
    code: "S2",
    name: "수리·개인",
    iconId: "store-icon-service",
    color: "#317d74",
  },
  M1: {
    code: "M1",
    name: "과학·기술",
    iconId: "store-icon-science",
    color: "#3478c9",
  },
  P1: {
    code: "P1",
    name: "교육",
    iconId: "store-icon-education",
    color: "#e28a31",
  },
  R1: {
    code: "R1",
    name: "예술·스포츠",
    iconId: "store-icon-leisure",
    color: "#d04d87",
  },
  N1: {
    code: "N1",
    name: "시설관리·임대",
    iconId: "store-icon-facility",
    color: "#65768a",
  },
  L1: {
    code: "L1",
    name: "부동산",
    iconId: "store-icon-real-estate",
    color: "#bf6b3f",
  },
  Q1: {
    code: "Q1",
    name: "보건의료",
    iconId: "store-icon-health",
    color: "#db4d55",
  },
  I1: {
    code: "I1",
    name: "숙박",
    iconId: "store-icon-lodging",
    color: "#5367b7",
  },
};

export function getStoreCategory(categoryCode) {
  return STORE_CATEGORIES[categoryCode] || DEFAULT_CATEGORY;
}

export function getDominantStoreCategory(stores) {
  const categoryCounts = new Map();

  stores.forEach((store) => {
    const code = store.majorCategoryCode || DEFAULT_CATEGORY.code;
    categoryCounts.set(code, (categoryCounts.get(code) || 0) + 1);
  });

  let dominantCode = DEFAULT_CATEGORY.code;
  let dominantCount = 0;

  categoryCounts.forEach((count, code) => {
    if (count > dominantCount) {
      dominantCode = code;
      dominantCount = count;
    }
  });

  return getStoreCategory(dominantCode);
}
