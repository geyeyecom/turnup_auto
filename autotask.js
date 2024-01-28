var moment = require('moment');
let request = require('request');
const config = require('config');
process.stdin.setEncoding("utf8");


const BASURL = 'https://turnup-uw-test-apiv2.turnup.so/api/';//userinfo';
const BASURLAPI_FRIENDTRADE_WORKINFO = 'v1/friendtrade_workinfo';

//get user info
const BASURLAPI_USER_INFO='v1/userinfo';

//get work state
const BASURLAPI_PORTFOLIO = 'v1/portfolio';

//go to work
const BASURLAPI_FRIENDTRADE_DISPATCH_EMPLYEES = 'v1/friendtrade_dispatch_emplyees';

//finish work
const BASURLAPI_FRIENDTRADE_TAKEWORKCOIN = 'v1/friendtrade_takeworkcoin';


//get
async function getuser_portfolio(token, uid) {

    var url = BASURL + BASURLAPI_PORTFOLIO;
    var requestData = {
        //"cursor": 0,
        // "userId":uid,
        "token": token
    };
    var data = {
        url: url,
        method: "POST",
        json: true,
        headers: {
            "content-type": "application/json",
        },
        body: (requestData)
    };

    try {
        const rdata = await requestPromise(data);
        return rdata.body;
    } catch (error) {
        console.error('An error occurred:', error);
    }

}


async function getuser_friendtrade_takeworkcoin(uid, token) {

    var url = BASURL + BASURLAPI_FRIENDTRADE_TAKEWORKCOIN;
    var requestData = {
        "employeeId": uid,
        "token": token
    };
    var data = {
        url: url,
        method: "POST",
        json: true,
        headers: {
            "content-type": "application/json",
        },
        body: (requestData)
    };
    try {
        const rdata = await requestPromise(data);
        return rdata.body;

    } catch (error) {
        console.error('An error occurred:', error);
    }

}

async function getuser_friendtrade_dispatch_emplyees(uid, wid, token) {

    var url = BASURL + BASURLAPI_FRIENDTRADE_DISPATCH_EMPLYEES;
    var requestData = {
        "emplyeeIds": uid,
        "workId": wid,
        "token": token
    };
    var data = {
        url: url,
        method: "POST",
        json: true,
        headers: {
            "content-type": "application/json",
        },
        body: (requestData)
    };
    try {
        const rdata = await requestPromise(data);
        return rdata.body;

    } catch (error) {
        console.error('An error occurred:', error);
    }

}

async function getuser_info( token,uid) {

    var url = BASURL + BASURLAPI_USER_INFO;
    var requestData = {
        "userId": uid,
        "token": token
    };
    var data = {
        url: url,
        method: "POST",
        json: true,
        headers: {
            "content-type": "application/json",
        },
        body: (requestData)
    };
    try {
        const rdata = await requestPromise(data);
        return rdata.body;

    } catch (error) {
        console.error('An error occurred:', error);
    }

}

async function dotask() {


    //check
    var tokenlist = config.get('tokenlist');
    if (tokenlist.length == 0) {
        console.log('please writen config tokens , Located in config/development. json'); //
        return;
    }

    var updatetime = moment().format('YYYY-MM-DD HH:mm:ss');

    console.log(updatetime + '-start-task----');

    let index = 0; 
    var holder;
    var userid = 0;
    var username;
    while (true) {
        updatetime = moment().format('YYYY-MM-DD HH:mm:ss');
        for (let i = 0; i < tokenlist.length; i++) {
            //console.log('run--dotask--1')
            var ret = await getuser_portfolio(tokenlist[i]);
            //console.log('run--dotask--2')

            if (ret && ret.code == 0) {
                holder = ret.data.holding;
                await sleep(1000 * 1);

                for (let j = 0; j < holder.length; j++) {
                    if (0 == holder[j]['needBuyKeyNum']) {
                        userid = holder[j]['userId'];
                        username = holder[j]['profile']['displayName'];

                        if (holder[j]['workEndTimestamp']) {
                            //wait task
                            var etime=moment(holder[j]['workEndTimestamp']*1000).format('YYYY-MM-DD HH:mm:ss');
                            console.log(updatetime + '-wait--task----'+ username+'--endtime-'+etime);
                            continue;
                        }
                        if (!holder[j]['selfWorkProfit']) {
                            //do task

                            var uinfo = await  getuser_info(tokenlist[i],0)//gey_work
                            var unlockWorkIds=uinfo['data']['selfData']['unlockWorkIds'];
                            var wid = unlockWorkIds[unlockWorkIds.length-1];

                            var r = await getuser_friendtrade_dispatch_emplyees([userid], wid, tokenlist[i]);
                           if(!r.code) {
                               console.log(updatetime + '-do--task----', username, wid, r);

                           } else {
                               //get
                                 r = await getuser_friendtrade_dispatch_emplyees([userid], 2, tokenlist[i]);
                               console.log(updatetime + '-do-restored energy-task----', username, wid, r);

                           }

                        }
                        if (holder[j]['selfWorkProfit']) {
                            // finish task

                            var r = await getuser_friendtrade_takeworkcoin(userid, tokenlist[i]);
                            console.log(updatetime + '-finish--task----', username);
                        }
                        await sleep(1000 * 2);
                    }

                }
            }
            await sleep(1000 * 5);
        }

        console.log('run--dotask', index++); //

    }

}


/*
await sleep(1500)
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

//
function requestPromise(options) {
    return new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (error) {
                reject(error);
            } else {
                resolve({response, body});
            }
        });
    });
}


dotask()
