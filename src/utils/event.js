export const refreshEvent = new Event("vcc_update");
export const triggerRefresh = () => window.dispatchEvent(refreshEvent);
