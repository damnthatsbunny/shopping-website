const BUY_NOW_KEY = 'urbancart_buy_now_draft';

export const saveBuyNowDraft = (draft) => {
  localStorage.setItem(BUY_NOW_KEY, JSON.stringify(draft));
};

export const readBuyNowDraft = () => {
  try {
    const draft = localStorage.getItem(BUY_NOW_KEY);
    return draft ? JSON.parse(draft) : null;
  } catch {
    return null;
  }
};

export const clearBuyNowDraft = () => {
  localStorage.removeItem(BUY_NOW_KEY);
};