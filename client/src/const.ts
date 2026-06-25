export function getLoginUrl(): string {
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = encodeURIComponent(`${window.location.origin}/api/oauth/callback`);
  const state = btoa(redirectUri);
  const oauthServerUrl = import.meta.env.VITE_OAUTH_SERVER_URL ?? "https://manus.im";
  return `${oauthServerUrl}/oauth/authorize?client_id=${appId}&redirect_uri=${redirectUri}&response_type=code&scope=openid+profile+email&state=${state}`;
}
