const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// 数据库文件路径
const DB_PATH = path.join(__dirname, 'maoren_plan.db');

// 连接到 SQLite 数据库 (如果不存在则创建)
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    // 创建表 (如果它们还不存在)
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS weekly_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        week_info TEXT,
        reporter_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) console.error('Error creating weekly_plans table', err.message);
      });

      db.run(`CREATE TABLE IF NOT EXISTS daily_tasks (\n        id INTEGER PRIMARY KEY AUTOINCREMENT,\n        plan_id INTEGER,\n        day_name TEXT, \n        date_detail TEXT, \n        module_header TEXT, \n        task_content TEXT, \n        status TEXT, \n        am_start_time TEXT,\n        am_end_time TEXT,\n        pm_start_time TEXT,\n        pm_end_time TEXT,\n        shooting_theme TEXT,\n        remarks TEXT, \n        FOREIGN KEY (plan_id) REFERENCES weekly_plans(id)\n      )`, (err) => {
        if (err) console.error('Error creating daily_tasks table', err.message);
      });

      db.run(`CREATE TABLE IF NOT EXISTS shooting_details (\n        id INTEGER PRIMARY KEY AUTOINCREMENT,\n        task_id INTEGER, \n        time_slot TEXT, \n        script_id TEXT,\n        product_info TEXT,\n        model_actor TEXT,\n        scene_shot TEXT,\n        props_costume TEXT,\n        duration_keyframes TEXT,\n        FOREIGN KEY (task_id) REFERENCES daily_tasks(id)\n      )`, (err) => {
        if (err) console.error('Error creating shooting_details table', err.message);
      });
    });
  }
});

app.use(express.json()); // 用于解析 JSON 请求体
app.use(express.static(path.join(__dirname, '../'))); // 静态文件服务，指向项目根目录

// API 路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// 获取周计划列表 (示例)
app.get('/api/plans', (req, res) => {
  const sql = `
    SELECT 
      wp.id AS plan_id, wp.week_info, wp.reporter_name, wp.created_at AS plan_created_at,
      dt.id AS task_id, dt.day_name, dt.date_detail, dt.module_header, dt.task_content, dt.status AS task_status,
      dt.am_start_time, dt.am_end_time, dt.pm_start_time, dt.pm_end_time, dt.shooting_theme, dt.remarks AS task_remarks,
      sd.id AS detail_id, sd.time_slot, sd.script_id, sd.product_info, sd.model_actor, 
      sd.scene_shot, sd.props_costume, sd.duration_keyframes
    FROM weekly_plans wp
    LEFT JOIN daily_tasks dt ON wp.id = dt.plan_id
    LEFT JOIN shooting_details sd ON dt.id = sd.task_id
    ORDER BY wp.created_at DESC, dt.id ASC, sd.id ASC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    const plansMap = new Map();
    rows.forEach(row => {
      if (!plansMap.has(row.plan_id)) {
        plansMap.set(row.plan_id, {
          id: row.plan_id,
          week_info: row.week_info,
          reporter_name: row.reporter_name,
          created_at: row.plan_created_at,
          daily_tasks: []
        });
      }

      const plan = plansMap.get(row.plan_id);
      let task = plan.daily_tasks.find(t => t.id === row.task_id);

      if (row.task_id && !task) {
        task = {
          id: row.task_id,
          day_name: row.day_name,
          date_detail: row.date_detail,
          module_header: row.module_header,
          task_content: row.task_content,
          status: row.task_status,
          am_start_time: row.am_start_time,
          am_end_time: row.am_end_time,
          pm_start_time: row.pm_start_time,
          pm_end_time: row.pm_end_time,
          shooting_theme: row.shooting_theme,
          remarks: row.task_remarks,
          shooting_details: []
        };
        plan.daily_tasks.push(task);
      }

      if (row.detail_id && task) {
        task.shooting_details.push({
          id: row.detail_id,
          time_slot: row.time_slot,
          script_id: row.script_id,
          product_info: row.product_info,
          model_actor: row.model_actor,
          scene_shot: row.scene_shot,
          props_costume: row.props_costume,
          duration_keyframes: row.duration_keyframes
        });
      }
    });

    res.json({ plans: Array.from(plansMap.values()) });
  });
});

// 创建新的周计划 (示例)
app.post('/api/plans', (req, res) => {
  const { week_info, reporter_name, daily_tasks_data } = req.body;
  if (!week_info || !reporter_name) {
    return res.status(400).json({ error: 'Week info and reporter name are required.' });
  }

  const insertPlanSql = `INSERT INTO weekly_plans (week_info, reporter_name) VALUES (?, ?)`;
  db.run(insertPlanSql, [week_info, reporter_name], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    const planId = this.lastID;

    if (daily_tasks_data && daily_tasks_data.length > 0) {
      const insertDailyTaskSql = `INSERT INTO daily_tasks (
        plan_id, day_name, date_detail, module_header, task_content, status, 
        am_start_time, am_end_time, pm_start_time, pm_end_time, shooting_theme, remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      
      const insertShootingDetailSql = `INSERT INTO shooting_details (
        task_id, time_slot, script_id, product_info, model_actor, 
        scene_shot, props_costume, duration_keyframes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

      // Use a counter to send response after all tasks are processed
      let tasksProcessed = 0;
      daily_tasks_data.forEach(task => {
        db.run(insertDailyTaskSql, [
          planId,
          task.day_name,
          task.date_detail,
          task.module_header,
          task.task_content,
          task.status,
          task.am_start_time,
          task.am_end_time,
          task.pm_start_time,
          task.pm_end_time,
          task.shooting_theme,
          task.remarks
        ], function(err) {
          if (err) {
            console.error('Error inserting daily task', err.message);
            // Handle error, maybe rollback or log
            tasksProcessed++;
            if (tasksProcessed === daily_tasks_data.length) {
              return res.status(500).json({ error: 'Failed to save some daily tasks.' });
            }
            return;
          }
          const taskId = this.lastID;
          if (task.shooting_details && task.shooting_details.length > 0) {
            let detailsProcessed = 0;
            task.shooting_details.forEach(detail => {
              db.run(insertShootingDetailSql, [
                taskId,
                detail.time_slot,
                detail.script_id,
                detail.product_info,
                detail.model_actor,
                detail.scene_shot,
                detail.props_costume,
                detail.duration_keyframes
              ], function(err) {
                if (err) {
                  console.error('Error inserting shooting detail', err.message);
                  // Handle error
                }
                detailsProcessed++;
                if (detailsProcessed === task.shooting_details.length && tasksProcessed === daily_tasks_data.length -1) {
                   // This check is tricky with nested async operations and callbacks
                }
              });
            });
          }
          tasksProcessed++;
          if (tasksProcessed === daily_tasks_data.length) {
            res.status(201).json({ message: 'Plan created successfully with all details', planId: planId });
          }
        });
      });
    } else {
      // No daily tasks, just return success for the plan itself
      res.status(201).json({ message: 'Plan created successfully (no daily tasks provided)', planId: planId });
    }
  });
});

// 启动服务器
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

// 关闭数据库连接
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log('Closed the database connection.');
    process.exit(0);
  });
});