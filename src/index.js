import schedule from 'node-schedule';


function delay(timeout) {
    return new Promise((resolve, reject) => {
        let wait = setTimeout(() => {
            clearTimeout(wait);
            resolve('timeout')
        }, timeout * 1000)
    });
}

class ScheduleUniqueProvider {

    constructor() {
        this.listJob = new Set();
        this.countSchedule = 0;
    }


    addSchedule(name, rule, timeout, callback, callbackError = null) {
        if (
            (!!process.env.instances && this.countSchedule % Number(process.env.instances) === Number(process.env.pm_id)) ||
            (process.env.NODE_APP_INSTANCE === '0') ||
            (process.env.INSTANCE_ID === '0')
        ) {
            this.run(name, rule, timeout, callback, callbackError);
        }
        this.countSchedule++;

    }

    run(name, rule, timeout, callback, callbackError = null) {
        const currentJob = schedule.scheduledJobs[name];
        if (!currentJob) {
            schedule.scheduleJob(name, rule, () => {
                if (!this.listJob.has(name)) {
                    this.listJob.add(name);
                    Promise.race([
                        delay(timeout),
                        callback()
                    ]).then(result => {
                        this.listJob.delete(name);
                        if (result === 'timeout') {
                            process.kill(process.pid);
                        }
                    }).catch(err => {
                        callbackError && callbackError(err);
                        this.listJob.delete(name);
                    });
                }
            });
        }
    }
}

export default new ScheduleUniqueProvider;