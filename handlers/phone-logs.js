const fs = require('fs');
const { getAgentsMap } = require('../utils/agent');
const { getPhoneLogsByNumber } = require('../utils/logs');

const PhoneLogs = {
    updateOrCreatePhoneLog: (agentsMap, phoneNumbers, newValue) => {
        const { number, agentIdentifier } = newValue;
        let PhoneLog = phoneNumbers.get(number) || { number, logs: [], };
        PhoneLog.logs = [...PhoneLog.logs, {...newValue, agent: agentsMap.get(agentIdentifier)}];
        return PhoneLog;
    },
    getPhoneLogsMap: (agentsMap) => new Promise((resolve, reject) => {
        fs.readFile('json-data/logs.json', (err, data) => {
            if (err) reject(err);
            const logs = JSON.parse(data);
            const phoneLogsMap = new Map();
            logs.forEach((value) => {
                const { number } = value;
                phoneLogsMap.set(number, PhoneLogs.updateOrCreatePhoneLog(agentsMap, phoneLogsMap, value));
            })
            resolve(phoneLogsMap);
        });
    }),
    getPhoneNumberFromLogs: () => new Promise((resolve, reject) => {
        getAgentsMap().then((agentsMap) => {
            PhoneLogs.getPhoneLogsMap(agentsMap).then((phoneLogsMap) => {
                resolve(Array.from(phoneLogsMap.values()));
            });
        });
    }),
    fetchPhoneLogs: (req, res) => {
        PhoneLogs.getPhoneNumberFromLogs().then((phoneLogs, reject) => {
            res.json({ phoneLogs });
        });
    },
    fetchPhoneLogsByNumber: async (req, res) => {
        const { params } = req;
        const { number } = params;
        if (!number) {
            return res.status(400).json({status: 400, message: "number must be present"})
        }

        const agentsMap = await getAgentsMap();
        getPhoneLogsByNumber(number, agentsMap).then((phoneLogs) => {
            res.json({ 
                status: 200,
                phoneLogs,
            });
        }).catch(({ message }) => {
            res.status(404).json({ status: 404, message });
        });
    }
};

module.exports = PhoneLogs;