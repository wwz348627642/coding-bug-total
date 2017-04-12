// 找到子元素则返回子元素本身，否则返回false
Array.prototype.find = function (value, key, children) {

  // 数组对象
  if (arguments.length > 1) {

    var childed = false;

    var find_child = function (main) {
      for (var i = 0; i < main.length; i++) {
        if (main[i][key] == value) {
          childed = main[i];
          return;
        } else if (children && main[i][children]) {
          find_child(main[i][children]);
        }
      }
    };

    find_child(this);
    return childed;
  }

  // 普通数组
  if (arguments.length == 1) {
    for (var i = 0; i < this.length; i++) {
      if (this[i] == value) return this[i];
    }
    return false;
  }
};

// 基础模型
function begin (project_id, user_id) {
	var baseUrl = `https://coding.net/api/project/${project_id}/activities`;
	var paganitionModel = {
		last_id: 999999999,
		user_id: user_id,
		type: 'all' // 
	}

	var now = new Date().getTime();
  // 8天前
	var before = 8 * 24 * 60 * 60 * 1000;
	var last = now - before;

	// 数据
	/*
		data = [
			{
				user:
				create: []
				finish: [] 
			}
		]
	*/
	var data = [];

	function format(obj, delimiter) {
		var delimiter = delimiter || '&';
		var arr = [];
		Object.keys(obj).forEach(function (key) {
			arr.push(key + '=' + obj[key]);
		})
		var str = arr.join(delimiter);
		return '?' + str
	} 

	function getTaskList () {
		return new Promise(function (resolve, reject) {
			var xhr = new XMLHttpRequest();
			var apiUrl = format(paganitionModel);
			xhr.open('GET', baseUrl + apiUrl, true);
			xhr.responseType = "json";
	    xhr.setRequestHeader("Accept", "application/json");
			xhr.onreadystatechange = function() {
				if (this.readyState === 4 && this.status === 200) {
					resolve(xhr.response)
				}
			}
			xhr.send();
		})
	}

	// 发出请求
	getTaskList()
		.then(function (res) {
			if (res.code === 0) {
				filterData(res.data)
			}
		})
		.catch(function (err) { 
			console.log(err) 
		});

	// 数据处理
	function filterData (array) {
		// 如果是空数组直接返回
		if (array.length === 0) return false;
		// 存最后一个的id做翻页备用
		var last_obj = array[array.length - 1];
		paganitionModel.last_id = last_obj.id

		for (var i = 0; i < array.length; ++i) {
			// 是任务，而不是评论
			if (array[i].target_type === 'Task') {
				// 匹配动作
				switch (array[i].action) {
					case 'update_deadline':
						// 更新任务
						break;
					case 'create':
						groupTask(array[i], 'create')
						// 创建
						break;
					case 'add_watcher':
						// 添加关注着
						break;
					case 'ressign':
						// 重新指派
						break;
					case 'update_priority':
						// 更新优先级
						break;
					case 'finish':
						groupTask(array[i], 'finish')
						// 任务完成
						break;
					case 'delete':
						// 删除了
						break;
				}
			}
		}

		if (last_obj.created_at > last) {
			// 递归请求
			getTaskList().then(function (res) {
				if (res.code == 0) {
					filterData(res.data)
				}
			});
		} else {
			// 数据整理完毕, 从dom上展示
			console.log(data);
			showData(data);
		}
	}

	// 数组分组
	function groupTask (item, key) {
		// 如果什么都没有时
		if (!data.length) {
			var obj = {
				user: item.user.name
			}
			obj[key] = [item];

			data.push(obj);
		} else {
		// 如果有数据
			// 先找自己
			var is_me = data.find(item.user.name, 'user');

			if (!!is_me) {
				// 如果有这个字段就直接添加
				if (!!is_me[key]) {
					is_me[key].push(item);
				} else {
				// 如果没这个字段的话，添加这个字段
					is_me[key] = [item];
				}
			} else {
			// 如果没找到自己
				var obj = {
					user: item.user.name
				}
				obj[key] = [item];

				data.push(obj);
			}
		}
	}

	// 展示数据
	function showData(data) {
		var content = document.getElementById('content');
		var wait = document.getElementById('wait');
		// 删除等待
		content.removeChild(wait)

		var dom_str = ''
		/*
			<tr class="box">
				<td>1</td>
			</tr>
		*/
		// 如果没有数据
		if (!data.length) {
			dom_str = `<tr>
									<td colspan="3">暂无数据</td>
								 </tr>`
			content.innerHTML = dom_str;
		}

		if (!!data.length) {
			// 循环数组
			for (let i = 0; i < data.length; ++i) {
				let tr = document.createElement('tr')
				let td = `<td>${data[i].user}</td>
				           <td>${ !!data[i].create ? data[i].create.length : 0 }</td>
				           <td>${ !!data[i].finish ? data[i].finish.length : 0 }</td>`
				tr.innerHTML = td;

				content.appendChild(tr);
			}
		}
	}
}

begin(322192, 225138)
