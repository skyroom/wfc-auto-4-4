// 足球赛事列表地址
var footballUrl = 'https://www.wfcworld.com/wap/competitionList/1';

// 足球赛事详情地址
var competitionDetailUrl = 'https://www.wfcworld.com/wap/bet/';

// 篮球赛事列表地址
var basketballUrl = 'https://www.wfcworld.com/wap/competitionList/2';

// https://www.wfcworld.com/api/bet  POST  gp_id: 97465  money: 20

async function mainXz() {
	// 先判断有没有余额
	var	salary = await getBalance();
	console.log(salary);
	if (salary == '未登录') {
		return;
	}
	if (salary == -1) {
		console.log('余额为-1，表示获取余额发生错误，重新开始执行mian函数');
		console.log('现在的时间是 '+ new Date());
		setTimeout(mainXz, 3000);
		return;
	}
	if (salary < 20) {
		console.log('余额小于20,3分钟后重新执行mian函数');
		console.log('现在的时间是 '+ new Date());
		setTimeout(mainXz, 3*60*1000);
		return;
	}
	var footballInfo = await searchLatest(footballUrl);
	var basketballInfo = await searchLatest(basketballUrl);
	if (footballInfo == '未登录' || basketballInfo == '未登录') {
		return;
	}
	if (footballInfo == -1 || basketballInfo == -1) {
		console.log('获取球赛列表发生错误，现在开始重新运行main函数');
		console.log('现在的时间是 '+ new Date());
		setTimeout(mainXz, 3000);
		return;
	}
	if (footballInfo == -2 || basketballInfo == -2) {
		console.error('平台有可能改了布局结构，快点更新程序吧');
		return;
	}
	console.log(footballInfo);
	console.log(basketballInfo);
	var xzInfo;
	if (footballInfo && basketballInfo) {
		if (footballInfo.time > basketballInfo.time) {
			// 选择篮球
			xzInfo = basketballInfo;
		} else {
			// 选择足球
			xzInfo = footballInfo;
		}
	} else if (!footballInfo && basketballInfo) {
		// 选择篮球
		xzInfo = basketballInfo;
	} else if (footballInfo && !basketballInfo) {
		// 选择足球
		xzInfo = footballInfo;
	} else if (!footballInfo && !basketballInfo) {
		// 足球和篮球都没有可选的
		console.log('啥也没有选择的，垃圾平台');
		console.log('现在的时间是 '+ new Date());
		setTimeout(mainXz, 7200000);
		keepLogin(7200000);
		return;
	}
	if (xzInfo.time - new Date() > 10*60*60*1000) {
		// 符合条件的赛事大于8个小时后开赛则不选择
		console.log('符合条件的赛事大于10个小时后开赛则不选择');
		console.log('现在的时间是 '+ new Date());
		console.log('5分钟后再次查询');
		setTimeout(mainXz, 5*60*1000);
	} else {
		xiazhu(xzInfo.xzId, xzInfo.salary, xzInfo);
	}
}
mainXz()

async function keepLogin(totalTime, p = 30) {
	var i = p;
	console.log('我开始保持登录状态');
	console.log('现在的时间是 '+ new Date());
	getList();
	
	async function getList() {
		if (i > 0) {
			setTimeout(async function() {
				i--;
				console.log('我要保持登录状态，i的值是 ' + i);
				console.log('现在的时间是 ' + new Date());
				try {
					var competitionList = await $.get('https://www.wfcworld.com/wap/competitionList/1');
					if (checkLogin(competitionList) == '未登录') {
						console.info('你已经退出登录了，请手动登录，然后再执行程序');
						return;
					}
					getList();
				} catch (err) {
					console.log('保持登录状态时发生错误，重新执行保持登录函数');
					console.log('现在的时间是 '+ new Date());
					keepLogin(totalTime, i);
				}
			}, totalTime/20);
		}
	}
}

async function getBalance() {
	var competitionList;
	var salary;
	try {
		var competitionList = await $.get('https://www.wfcworld.com/wap/competitionList/1');
		if (checkLogin(competitionList) == '未登录') {
			console.info('你已经退出登录了，请手动登录，然后再执行程序');
			return '未登录';
		}
	} catch (err) {
		console.log('获取余额时发生错误');
		console.log('现在的时间是 '+ new Date());
		competitionList = -1;
	}
	if (competitionList == -1) {
		return -1;
	}
	var vdomHtml = competitionList.match(/<head>[\s\S]*<\/body>/);
	var vdom = document.createElement("html");
	vdom.innerHTML = vdomHtml;
	salary = Number($($(vdom).find('ul')[0]).find('span').text());
	return salary;
}

async function searchLatest(footballUrl) {
	var footballList;
	var competitionInfo = {};
	try {
		// 首先获取足球赛事列表
		footballList = await $.get(footballUrl);
		if (checkLogin(footballList) == '未登录') {
			console.info('你已经退出登录了，请手动登录，然后再执行程序');
			return '未登录';
		}
	} catch (err) {
		console.log('获取球赛列表发生错误！');
		console.log('现在的时间是 '+ new Date());
		console.log(err);
		footballList = -1;
	}
	if (footballList == -1) {
		return -1;
	}
	var footballNumList = footballList.match(/num="\d*"/g);
	console.log(footballNumList);
	if (!footballNumList) {
		// 表示没有赛事
		return false;
	}
	// 得到赛事列表后开始进入每个赛事详情
	for(var i = 0; i<footballNumList.length;i++) {
		var competitionDetailList;
		try {
			var competitionDetailList = await $.get(competitionDetailUrl + footballNumList[i].slice(5,-1));
			if (checkLogin(competitionDetailList) == '未登录') {
				console.info('你已经退出登录了，请手动登录，然后再执行程序');
				return '未登录';
			}
		} catch (err) {
			console.log('获取球赛详情发生错误！');
			console.log('现在的时间是 '+ new Date());
			console.log(err);
			competitionDetailList = -1;
		}
		if (competitionDetailList == -1) {
			return -1;
		}
		var vdomHtml = competitionDetailList.match(/<head>[\s\S]*<\/body>/);
		var vdom = document.createElement("html");
		vdom.innerHTML = vdomHtml;
		//console.log(vdom)
		// 比分
		var score = $($(vdom).find('table')[0]).find('tr:last-child td:first-child strong').text();
		if (score != '4:4' && score != '包赔100:100') {
			// 表示最后一个tr不是包赔的行，难道平台改了布局结构
			return -2;
		}
		// 交易量
		var volume = $($(vdom).find('table')[0]).find('tr:last-child td:last-child').text();
     	console.log(volume);
     	// 余额
     	var salary = $($(vdom).find('ul')[0]).find('span').text();
     	console.log(salary);

     	var competitionStartTime = new Date(competitionDetailList.match(/\d*-\d*-\d* \d*:\d*:\d*/));

     	if (competitionInfo.xzId && competitionInfo.competitionStartTime < competitionStartTime) {
     		console.log('最终找到的下注信息是，比赛时间： ' + competitionInfo.competitionStartTime + ' ' + '收益 ' + competitionInfo.income);
 			return {
 				time: competitionInfo.competitionStartTime,
 				xzId: competitionInfo.xzId,
 				salary: salary
 			};
     	}

     	if(Number(volume) > Number(salary) && Number(salary) > 20) {
 			// 表示可以下单
 			// console.log('可以下单了');
 			// 收益
     		var income = parseFloat($($(vdom).find('table')[0]).find('tr:last-child td:first-child+td').text());
     		// 比分的id
     		var xzId = $($(vdom).find('table')[0]).find('tr:last-child td:last-child').attr('id').slice(3);
     		
 			console.log('发现一个可以下注的比分，比赛时间是 ' + competitionStartTime + ' ' + '收益是 ' + income);
 			// 判断 competitionInfo 是否是空对象，是对象就第一次赋值
 			if (!competitionInfo.xzId) {
 				competitionInfo.xzId = xzId;
 				competitionInfo.income = income;
 				competitionInfo.competitionStartTime = competitionStartTime;
 				continue;
 			}
 			if (String(competitionInfo.competitionStartTime) == String(competitionStartTime)) {
 				if (competitionInfo.income < income) {
 					competitionInfo.xzId = xzId;
 					competitionInfo.income = income;
 					competitionInfo.competitionStartTime = competitionStartTime;
 					continue;
 				} else {
 					continue;
 				}
 			}
 			if (competitionInfo.competitionStartTime < competitionStartTime) {
 				console.log('最终找到的下注信息是，比赛时间： ' + competitionInfo.competitionStartTime + ' ' + '收益 ' + competitionInfo.income);
 				return {
 					time: competitionInfo.competitionStartTime,
 					xzId: competitionInfo.xzId,
 					salary: salary
 				};
 			}
     	}
	}
	if (i == footballNumList.length && !competitionInfo.xzId) {
		return false;
	} else if (i == footballNumList.length && competitionInfo.xzId) {
		console.log('最终找到的下注信息是，比赛时间： ' + competitionInfo.competitionStartTime + ' ' + '收益 ' + competitionInfo.income);
 		return {
 			time: competitionInfo.competitionStartTime,
 			xzId: competitionInfo.xzId,
 			salary: salary
 		};
	}
}

// 下注函数
async function xiazhu(xzId, salary, xzInfo) {
	try {
		var xzResult = await $.post('https://www.wfcworld.com/api/bet', {
 			gp_id: xzId,
 			money: salary
 		});
 		if (checkLogin(xzResult) == '未登录') {
			console.info('你已经退出登录了，请手动登录，然后再执行程序');
			return;
		}
	} catch (err) {
		console.log('下注函数发生错误，10秒钟后再次尝试下注，错误信息如下');
		console.log(err);
		console.log('现在的时间是 '+ new Date());
		xzResult = -1;
		setTimeout(xiazhu.bind(null, xzId, salary, xzInfo),10000);
	}
	if (xzResult == -1) {
		return;
	}
	if (xzResult.status == 1){
 		console.log(xzResult);
 		console.log('将在 ' + xzInfo.time + ' 后两个小时开始获取赛事列表');
		console.log('现在的时间是 '+ new Date());
		setTimeout(mainXz, xzInfo.time - new Date() + 7200000);
		keepLogin(xzInfo.time - new Date() + 7200000);
	} else if (xzResult.status == 0 && xzResult.msg == '该波胆可交易量不足'){
 		setTimeout(mainXz, 3000);
	} else if (xzResult.status == 0 && xzResult.msg == '余额不足，请充值') {
		console.error('没钱了，快充值吧')
	} else if (xzResult.status == 0 && xzResult.msg == '重复提交,请稍后重试!') {
		await setTimeout(mainXz,3000);
	}
}

function checkLogin(result) {
	if (result.indexOf && result.indexOf('You are being redirected') > -1) {
		return '未登录';
	} else {
		return '已登录';
	}
}