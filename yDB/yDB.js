(function (global) {
  "use strict";

  const YDB_DBLIST = 'YDB_DBLIST'; // 数据库本身保留字

  let yDB = function () {
    this.db = null;
    this.dbList = {}; // 用于保存所有数据库
  }

  yDB.prototype = {
    // 初始化数据库状态， 包括数据库列表等
    init() {
      // 获取数据库列表
      let dbList = localStorage.getItem(YDB_DBLIST);
      if (!dbList) { // 第一次运行， 不存在数据库列表
        localStorage.setItem(YDB_DBLIST, '{}');
        dbList = {};
      }
      this.dbList = JSON.parse(dbList);
    },
    end() {
      // 操作完数据库的最后应该保存数据到本地
      localStorage.setItem(YDB_DBLIST, JSON.stringify(this.dbList));
    },
    // 清空所有数据
    clear() {
      localStorage.setItem(YDB_DBLIST, '');
    },
    // 保存当前db到dblist中
    saveDBListItem(db, dbName) {
      this.dbList[dbName] = db;
    },
    // 使用一个数据库，如果该数据库不存在则创建为新的数据库
    use(dbName) {
      let db = this.dbList[dbName];
      if (!db) {
        db = {
          _name: dbName
        }; // 空数据库
        this.saveDBListItem(db, dbName);
      }
      this.db = db;
    },
    showDbs() {
      for (let key in this.dbList) {
        console.log(this.dbList[key]._name);
      }
      return this.dbList;
    },
    // 删除当前数据库
    dropDatabase() {
      if (!this.db) {
        console.error('you should use db first');
        return;
      }
      delete this.dbList[this.db._name];
      this.db = null; // 指向置空
    },
    // 创建集合
    createCollection(name, options) {
      this.db[name] = {
        _name: name,
        _data: []
      };
    },
    getCollection(name) {
      return this.db[name];
    },
    // 删除集合
    drop(name) {
      if (!!this.db && !!this.db[name]) {
        delete this.db[name];
      }
    },
    // 插入数据
    insert(name, data) {
      if (!this.db[name]) this.createCollection(name); // 不存在集合时自动创建集合
      let id = uuid(20);
      if(!data._id) data._id = id;
      this.db[name]._data.push(data);
    },
    // 根据某一条件查询数据
    // { id: 101 }
    find(name, condition, options) {
      let data = this.db[name]._data; // 获取该集合中的数据
      let res = [];
      let conditionString = JSON.stringify(condition);
      data.forEach(item => {
        let arr = obj2Arr(item);
        for(let i = 0; i< arr.length; i++) {
          if(JSON.stringify(arr[i]) === conditionString) {
            res.push(item);
            break;
          }
        }
      })
      return res;
    },
    remove(name, condition, options) {
      let data = this.db[name]._data;
      let res = [];
      let conditionString = JSON.stringify(condition);
      let idxs = [];
      data.forEach((item, index) => {
        let arr = obj2Arr(item);
        let flag = false;
        for(let i = 0; i< arr.length; i++) {
          if(JSON.stringify(arr[i]) === conditionString) {
            res.push(item);
            idxs.push(index);
          }
        }
      })
      this.db[name]._data = deleteArrByIdxs(data, idxs);
      return res;
    },
    update(name, condition, newData) {
      let data = this.db[name]._data;
      let conditionString = JSON.stringify(condition);
      this.db[name]._data = data.map((item) => {
        let arr = obj2Arr(item);
        for(let i = 0; i< arr.length; i++) {
          if(JSON.stringify(arr[i]) === conditionString) {
            if(!newData._id) newData._id = uuid(20);
            item = newData;
            break;
          }
        }
        return item;
      })
      return true;
    }
  }


  function deleteArrByIdxs(arr, idxs) {
    let res = arr.filter((item, index) => {
      let flag = true;
      idxs.forEach(idx => {
        if(index === idx) {
          flag = false;
        }
      })
      return flag;
    });
    return res; 
  }

  function obj2Arr(obj) {
    let res = [];
    for(let key in obj) {
      res.push({
        [key]: obj[key]
      })
    }
    return res;
  }

  function isArray(o) {
    return Object.prototype.toString.call(o) === '[object Array]';
  }

  function uuid(len) {
    let str = "",
      range = len,
      pos = "",
      arr = [
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l',
        'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
        'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L',
        'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',];
    for (let i = 0; i < range; i++) {
      pos = Math.round(Math.random() * (arr.length - 1));
      str += arr[pos];
    }
    return str;
  }

  global.yDB = new yDB();
}(this))