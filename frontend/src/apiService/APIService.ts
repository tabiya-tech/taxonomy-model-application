export const fetchWithAuth = (apiUrl: string, init: RequestInit = {}): Promise<Response> => {
  const token = sessionStorage.getItem("authToken");
  const headers = new Headers(init.headers || {});
  if (token) {
    headers.append("Authorization", `Bearer ${token}`);
  }
  const enhancedInit = { ...init, headers };

  return fetch(apiUrl, enhancedInit);
};
