// app.js - minimal frontend using fetch
const API = 'http://localhost:3000/api';
let token = localStorage.getItem('token') || null;
let currentUser = JSON.parse(localStorage.getItem('user') || 'null');

function setAuth(t, user) {
  token = t;
  currentUser = user;
  if (t) {
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(user));
    document.getElementById('logout').style.display = 'inline-block';
    document.getElementById('show-login').style.display = 'none';
    document.getElementById('show-register').style.display = 'none';
    document.getElementById('create-post').classList.remove('hidden');
  } else {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    token = null;
    currentUser = null;
    document.getElementById('logout').style.display = 'none';
    document.getElementById('show-login').style.display = 'inline-block';
    document.getElementById('show-register').style.display = 'inline-block';
    document.getElementById('create-post').classList.add('hidden');
  }
}

async function api(path, method='GET', body=null){
  const opts = { method, headers: {} };
  if (token) opts.headers['Authorization'] = 'Bearer ' + token;
  if (body) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
  const res = await fetch(API + path, opts);
  return res.json();
}

// UI wiring
document.getElementById('show-login').onclick = () => {
  document.getElementById('login-form').classList.remove('hidden');
  document.getElementById('register-form').classList.add('hidden');
};
document.getElementById('show-register').onclick = () => {
  document.getElementById('register-form').classList.remove('hidden');
  document.getElementById('login-form').classList.add('hidden');
};
document.getElementById('logout').onclick = () => { setAuth(null, null); renderFeed(); };

document.getElementById('do-register').onclick = async () => {
  const username = document.getElementById('reg-username').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  const avatar = document.getElementById('reg-avatar').value;
  const bio = document.getElementById('reg-bio').value;
  const res = await api('/auth/register', 'POST', { username, email, password, avatarUrl: avatar, bio });
  if (res.token) { setAuth(res.token, res.user); document.getElementById('register-form').classList.add('hidden'); renderFeed(); }
  else alert(res.error || JSON.stringify(res));
};

document.getElementById('do-login').onclick = async () => {
  const id = document.getElementById('login-identifier').value;
  const pw = document.getElementById('login-password').value;
  const res = await api('/auth/login', 'POST', { usernameOrEmail: id, password: pw });
  if (res.token) { setAuth(res.token, res.user); document.getElementById('login-form').classList.add('hidden'); renderFeed(); }
  else alert(res.error || JSON.stringify(res));
};

document.getElementById('post-button').onclick = async () => {
  const content = document.getElementById('post-content').value;
  if (!content.trim()) return alert('Empty post');
  const res = await api('/posts', 'POST', { content });
  if (res.id) { document.getElementById('post-content').value = ''; renderFeed(); }
  else alert(res.error || JSON.stringify(res));
};

async function renderFeed(){
  const el = document.getElementById('posts');
  el.innerHTML = '<em>Loading...</em>';
  const posts = await api('/posts');
  if (!Array.isArray(posts)) { el.innerHTML = 'Error loading feed'; return; }
  el.innerHTML = '';
  posts.forEach(p => {
    const div = document.createElement('div'); div.className = 'post card';
    const meta = document.createElement('div'); meta.className = 'meta';
    const left = document.createElement('div'); left.innerHTML = `<strong>${p.user.username}</strong>`;
    const right = document.createElement('div'); right.className = 'small'; right.textContent = new Date(p.createdAt).toLocaleString();
    meta.appendChild(left); meta.appendChild(right);

    const content = document.createElement('div'); content.textContent = p.content;
    const actions = document.createElement('div'); actions.className = 'actions small';
    const likeBtn = document.createElement('button'); likeBtn.textContent = `❤ ${p.likesCount || 0}`; likeBtn.onclick = async () => {
      if (!token) return alert('login required');
      const res = await api(`/posts/${p.id}/like`, 'POST');
      renderFeed();
    };

    const commentInput = document.createElement('input'); commentInput.placeholder = 'Write a comment...';
    const commentBtn = document.createElement('button'); commentBtn.textContent = 'Comment';
    commentBtn.onclick = async () => {
      if (!token) return alert('login required');
      const content = commentInput.value;
      if (!content) return;
      await api(`/posts/${p.id}/comments`, 'POST', { content });
      renderFeed();
    };

    actions.appendChild(likeBtn);
    actions.appendChild(commentInput);
    actions.appendChild(commentBtn);

    div.appendChild(meta);
    div.appendChild(content);

    // comments
    if (p.comments && p.comments.length) {
      p.comments.forEach(c => {
        const cc = document.createElement('div'); cc.className = 'comment';
        cc.innerHTML = `<strong>${c.user.username}</strong> ${c.content} <div class="small">${new Date(c.createdAt).toLocaleString()}</div>`;
        div.appendChild(cc);
      });
    }

    div.appendChild(actions);
    el.appendChild(div);
  });
}

// profile display (simple)
async function viewProfile(userId) {
  const res = await api(`/users/${userId}`);
  if (res.error) return alert(res.error);
  const section = document.getElementById('profile');
  section.classList.remove('hidden');
  const body = document.getElementById('profile-body');
  body.innerHTML = `<div><h3>${res.user.username}</h3><p>${res.user.bio || ''}</p>
  <p>Followers: ${res.followerCount} • Following: ${res.followingCount}</p>
  <button id="followBtn">${'Follow/Unfollow'}</button>
  <h4>Posts</h4></div>`;
  const btn = document.getElementById('followBtn');
  btn.onclick = async () => {
    if (!token) return alert('login required');
    const r = await api(`/users/${userId}/follow`, 'POST');
    alert(r.following ? 'Following' : 'Unfollowed');
    viewProfile(userId);
  };
  // show posts
  res.posts.forEach(p => {
    const d = document.createElement('div'); d.className = 'post';
    d.innerHTML = `<div><strong>${res.user.username}</strong> ${p.content}</div>`;
    body.appendChild(d);
  });
}

setAuth(token, currentUser);
renderFeed();
