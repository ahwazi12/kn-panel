const express = require('express');
const app = express();
var AdmZip = require("adm-zip");
const mysql = require('mysql2/promise');
const fs = require('fs')
const path = require('path');
app.use(express.json());

const db_config = 
{
    host: '127.0.0.1',
    user: 'root',
    password: process.env.PW,
    database: 'marzban'
};



async function run_query(query)
{ 
    const connection = await mysql.createConnection(db_config);
    try 
    {
      const [rows, fields] = await connection.execute(query);
      return "OK";
    } 

    catch (err) 
    {
      throw err;
    } 

    finally 
    {
      connection.end();
    }
}

async function get_users()
{
    const connection = await mysql.createConnection(db_config);
    try 
    {
      const [rows, fields] = await connection.execute("SELECT id,username,status,used_traffic,data_limit,expire,created_at FROM users");
      return rows;
    } 

    catch (err) 
    {
      throw err;
    } 

    finally 
    {
      connection.end();
    }
}


async function get_user_id(username)
{
    const connection = await mysql.createConnection(db_config);
    try 
    {
      const [rows, fields] = await connection.execute(
        `SELECT id FROM users WHERE username = ?`,
        [username]
      );

      if (rows.length > 0) 
      {
        return rows[0].id;
      } 

      else 
      {
        throw new Error("User not found");
      }
    } 
    
    catch (err) 
    {
      throw err;
    } 
    
    finally
    {
      connection.end();
    }
}

async function get_users_and_proxies(users_arr)
{
    const connection = await mysql.createConnection(db_config);
    try {
      const [rows, fields] = await connection.execute(
        `SELECT * FROM users WHERE username IN (${users_arr.map((u) => `'${u}'`).join(",")})`
      );
  

      const [proxyRows, proxyFields] = await connection.execute(
        `SELECT * FROM proxies WHERE user_id IN (${rows.map((v) => `'${v.id}'`).join(",")})`
      );
  
      const result = rows.map((user) => {
        const userProxies = proxyRows.filter((proxy) => proxy.user_id === user.id);
        return {
          user,
          proxies: userProxies
        };
      });
  
      return result;
    } 

    catch (err) 
    {
      throw err;
    } 

    finally
    {
      connection.end();
    }
  
}

async function user_id__to__proxy_id(id_arr)
{
    const connection = await mysql.createConnection(db_config);
    try 
    {
      const [rows, fields] = await connection.execute(
        `SELECT id FROM proxies WHERE user_id IN (${id_arr.map((u) => `'${u}'`).join(",")})`
      );
      return rows.map((r) => r.id);
    } 

    catch (err) 
    {
      throw err;
    } 

    finally
    {
      connection.end();
    }
}




app.use(async (req,res,next) =>
{
    var {api_key} = req.body;

    if (api_key != "resllmwriewfeujeh3i3ifdkmwheweljedifefhyr")
    {
        res.send("invalid api key");
        return;
    }

    next();
});

app.post("/ping", async (req,res) =>
{
    res.send("OK");
});

app.post("/edit_expire_times", async (req,res) => 
{
    try
    {
        var result = await run_query(`UPDATE users SET expire = expire + ${req.body.added_time}`);
        res.send("OK");
    }

    catch (err)
    {
        console.log(err);
        res.send("ERR");
    }

});

app.post("/dldb", async (req, res) => 
{
    try 
    {
        const connection = await mysql.createConnection(db_config);

        const [tables] = await connection.execute("SHOW TABLES");

        let backup_sql = '';

        for (const table_obj of tables) 
        {
            const table_name = Object.values(table_obj)[0];

            const [create_table_result] = await connection.execute(`SHOW CREATE TABLE \`${table_name}\``);
            backup_sql += `${create_table_result[0]['Create Table']};\n\n`;

            const [rows] = await connection.execute(`SELECT * FROM \`${table_name}\``);

            if (rows.length > 0) 
            {
                const keys = Object.keys(rows[0]);
                const values = rows.map(row => `(${keys.map(key => connection.escape(row[key])).join(', ')})`);
                backup_sql += `INSERT INTO \`${table_name}\` (${keys.join(', ')}) VALUES ${values.join(', ')};\n\n`;
            }
        }

        const backup_file = path.join(__dirname, 'db.sql');
        fs.writeFileSync(backup_file, backup_sql);

        var zip_id = Date.now();
        var zip_name = `bu_${zip_id}.zip`;

        const zip_file = path.join(__dirname, zip_name);
        const zip = new AdmZip();

        zip.addLocalFile(backup_file);
        zip.writeZip(zip_file);

        res.sendFile(zip_file, (err) => 
        {
            if (err) 
            {
                console.error(err);
                res.send("ERR");
            }

            fs.unlinkSync(backup_file);
            fs.unlinkSync(zip_file);
        });

        connection.end();
    } 
    
    catch (err) 
    {
        console.log(err);
        res.send("ERR");
    }
});



app.post("/get_marzban_users", async (req,res) =>
{
    var result = {};
    result.users = await get_users();
    res.send(result);
});


app.post("/delete_users", async (req,res) =>
{
    var { users } = req.body;

    try
    {
        var deleted_users = await get_users_and_proxies(users);
        await run_query(`DELETE FROM user_usage_logs WHERE user_id IN (${deleted_users.map((u) => `'${u.user.id}'`).join(",")})`);
        await run_query(`DELETE FROM node_user_usages WHERE user_id IN (${deleted_users.map((u) => `'${u.user.id}'`).join(",")})`);
        var proxy_ids = await user_id__to__proxy_id(deleted_users.map((u) => u.user.id));
        await run_query(`DELETE FROM exclude_inbounds_association WHERE proxy_id IN (${proxy_ids.map((u) => `'${u}'`).join(",")})`);
        await run_query(`DELETE FROM proxies WHERE user_id IN (${deleted_users.map((u) => `'${u.user.id}'`).join(",")})`);
        await run_query(`DELETE FROM users WHERE username IN (${users.map((u) => `'${u}'`).join(",")})`);
        res.send({status:"OK",deleted_users});
    }

    catch (err)
    {
        console.log(err);
        res.send("ERR");
    }
});

app.post("/add_users", async (req,res) =>
{
    var { deleted_users,available_protocols } = req.body;
    try
    {
        for(obj of deleted_users)
        {
            var { user, proxies } = obj;
            await run_query(`INSERT INTO users (username,status,used_traffic,data_limit,expire,created_at,admin_id,data_limit_reset_strategy) VALUES ('${user.username}', '${user.status}', '${user.used_traffic}', '${user.data_limit}', '${user.expire}', STR_TO_DATE('${user.created_at}', '%Y-%m-%d %H:%i:%s.%f'), '${user.admin_id}', '${user.data_limit_reset_strategy}')`);
            //'%Y-%m-%dT%H:%i:%s.%fZ'
            var user_id = await get_user_id(user.username);
            for (proxy of proxies)
            {
                if(available_protocols.includes(proxy.type.toLowerCase())) await run_query(`INSERT INTO proxies (user_id,type,settings) VALUES ('${user_id}', '${proxy.type}', '${JSON.stringify(proxy.settings).replace(/\\/g,"")}')`);
            }
        }
    
        res.send("OK")
    }

    catch(err)
    {
        console.log(err);
        res.send("ERR");
    }
});


app.listen(7002);