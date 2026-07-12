export async function onRequest(context) {
  const { request, env } = context;
  const { username, password, role } = await request.json();

  // 读取你在 Cloudflare 面板设置的环境变量“主密钥”
  const masterKey = env.MASTER_KEY; 
  if (!masterKey) {
    return new Response(JSON.stringify({ error: "服务器未配置主密钥" }), { status: 500 });
  }

  // 核心密码计算公式：SHA256(用户名 + 角色 + 主密钥) => 派生出子密码
  const encoder = new TextEncoder();
  const data = encoder.encode(username + ':' + role + ':' + masterKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const expectedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // 比对用户输入的密码和算出的子密码
  if (password === expectedPassword) {
    // 登录成功，返回一个简单的 Token（生产环境应该用 JWT）
    return new Response(JSON.stringify({ 
      success: true, 
      role: role, 
      token: "login_success_" + Date.now() 
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } else {
    return new Response(JSON.stringify({ error: "密码错误，请核对你使用的子密码" }), { 
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
}
