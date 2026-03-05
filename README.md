# LUMINA — ລະບົບຈັດການ Media Production

## ວິທີ Deploy ຜ່ານ Git + Railway

### ຂັ້ນຕອນທີ 1 — ສ້າງ Git Repo (ເຮັດຄັ້ງດຽວ)

```bash
# ຕ້ອງມີ Git ຕິດຕັ້ງໄວ້ກ່ອນ
git init
git add .
git commit -m "initial: LUMINA system"
```

### ຂັ້ນຕອນທີ 2 — Push ຂຶ້ນ GitHub

1. ໄປ **github.com** → ກົດ **New repository**
2. ຕັ້ງຊື່: `lumina-management` → Create
3. Copy URL ຂອງ repo ຂຶ້ນມາ ແລ້ວ run:

```bash
git remote add origin https://github.com/ຊື່ຂອງເຈົ້າ/lumina-management.git
git branch -M main
git push -u origin main
```

### ຂັ້ນຕອນທີ 3 — Deploy ຜ່ານ Railway

1. ໄປ **railway.app** → Login ດ້ວຍ GitHub
2. ກົດ **New Project** → **Deploy from GitHub repo**
3. ເລືອກ repo `lumina-management`
4. Railway ຈະ deploy ອັດຕະໂນມັດ (~2 ນາທີ)
5. ກົດ **Generate Domain** ໄດ້ URL ສຳລັບໃຊ້ງານ

### ການ Update ລະບົບ (ຕໍ່ໆໄປ)

```bash
# ເມື່ອໄດ້ໄຟລ໌ lumina-system.html ໃໝ່ — copy ໄປ index.html ແລ້ວ:
git add .
git commit -m "update: description of changes"
git push
# Railway ຈະ re-deploy ອັດຕະໂນມັດ
```

---

## Login

| Username | Password | ສິດ |
|----------|----------|-----|
| admin | admin1234 | Admin (ທຸກຢ່າງ) |

**ໝາຍເຫດ:** ປ່ຽນລະຫັດຜ່ານຫຼັງ Login ທຳອິດ ໃນ Profile (ກົດຊື່ຢູ່ sidebar)

---

## ໂຄງສ້າງໄຟລ໌

```
lumina-management/
├── index.html     ← ໄຟລ໌ຫຼັກ (Single-page app ທັງໝົດ)
├── server.js      ← Express server (ສຳລັບ Railway)
├── package.json   ← Dependencies
├── .gitignore
└── README.md
```
