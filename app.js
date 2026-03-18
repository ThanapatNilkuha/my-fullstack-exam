const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const fs = require('fs');
const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

const sequelize = new Sequelize({ dialect: 'sqlite', storage: './database.sqlite' });

// --- 1. ตารางหมวดหมู่ (Category) ---
const Category = sequelize.define('Category', {
    name: {
        type: DataTypes.STRING,
        allowNull: false // ห้ามว่าง
    },
    description: {
        type: DataTypes.STRING,
        defaultValue: "ไม่มีคำอธิบาย" // ถ้าไม่กรอก ให้ขึ้นคำนี้
    }
}, { timestamps: false });

// --- 2. ตารางผู้แต่ง (Author) ---
const Author = sequelize.define('Author', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    country: {
        type: DataTypes.STRING,
        defaultValue: "ไม่ระบุประเทศ"
    }
}, { timestamps: false });

// --- 3. ตารางหนังสือ (Book) ---
const Book = sequelize.define('Book', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    price: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    stock: {
        type: DataTypes.INTEGER,
        defaultValue: 0 // ถ้าไม่กรอก ให้เป็น 0 เล่ม
    },
    publishedYear: {
        type: DataTypes.INTEGER,
        allowNull: false // บังคับกรอกปีที่พิมพ์
    }
}, { timestamps: false });

// --- ความสัมพันธ์ (Relationships) ---
Book.belongsTo(Category);
Category.hasMany(Book);
Book.belongsTo(Author);
Author.hasMany(Book);

// --- Routes หน้าเว็บ ---
app.get('/', async (req, res) => {
    const categories = await Category.findAll();
    const authors = await Author.findAll();
    res.render('index', { categories, authors });
});

app.post('/push', async (req, res) => {
    // บันทึกข้อมูลแบบจัดเต็ม
    await Book.create({ 
        name: req.body.name, 
        price: req.body.price,
        stock: req.body.stock || 0,
        publishedYear: req.body.publishedYear,
        CategoryId: req.body.categoryId,
        AuthorId: req.body.authorId
    });
    res.redirect('/report');
});

app.get('/report', async (req, res) => {
    const books = await Book.findAll({ include: [Category, Author] });
    res.render('report', { items: books });
});

// --- ฟังก์ชันรันระบบ ---
async function start() {
    await sequelize.sync(); 
    const count = await Book.count(); 

    if (count === 0) {
        const raw = fs.readFileSync('data.json');
        const data = JSON.parse(raw);
        await Category.bulkCreate(data.categories);
        await Author.bulkCreate(data.authors);
        await Book.bulkCreate(data.books);
        console.log('✅ ดูดข้อมูล JSON (3 ตารางแบบมีกฎ) สำเร็จ!');
    } else {
        console.log('✅ ตรวจพบข้อมูล 3 ตารางในระบบ พร้อมใช้งาน!');
    }

    app.listen(3000, () => console.log('🚀 เปิดเว็บที่ http://localhost:3000'));
}
start();
