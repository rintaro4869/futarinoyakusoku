-- usersテーブルにメール認証用のカラムを追加
ALTER TABLE users ADD COLUMN email TEXT UNIQUE;
ALTER TABLE users ADD COLUMN password_hash TEXT;
