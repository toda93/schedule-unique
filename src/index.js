import schedule from 'node-schedule';


function delay(timeoutSecond) {
    return new Promise((resolve, reject) => {
        let wait = setTimeout(() => {
            clearTimeout(wait);
            resolve('timeoutSecond')
        }, timeoutSecond * 1000)
    });
}

class ScheduleUniqueProvider {

    constructor() {
        this.listJob = new Set();
        this.countSchedule = 0;
    }


    addSchedule(name, rule, timeoutSecond, callback, callbackError = null) {
        if (
            (!!process.env.instances && this.countSchedule % Number(process.env.instances) === Number(process.env.pm_id)) ||
            (process.env.NODE_APP_INSTANCE === '0') ||
            (process.env.INSTANCE_ID === '0')
        ) {
            this.run(name, rule, timeoutSecond, callback, callbackError);
        }
        this.countSchedule++;

    }

    run(name, rule, timeoutSecond, callback, callbackError = null) {
        const currentJob = schedule.scheduledJobs[name];
        if (!currentJob) {
            schedule.scheduleJob(name, rule, () => {
                if (!this.listJob.has(name)) {
                    this.listJob.add(name);
                    Promise.race([
                        delay(timeoutSecond),
                        callback()
                    ]).then(result => {
                        this.listJob.delete(name);
                        if (result === 'timeoutSecond') {
                            process.kill(process.pid);
                        }
                    }).catch(err => {
                        callbackError && callbackError(name, err);
                        this.listJob.delete(name);
                    });
                }
            });
        }
    }
}

export default new ScheduleUniqueProvider;

export const _1_SECOND = '* * * * * *';
export const _2_SECONDS = '*/2 * * * * *';
export const _5_SECONDS = '*/5 * * * * *';
export const _10_SECONDS = '*/10 * * * * *';
export const _15_SECONDS = '*/25 * * * * *';
export const _30_SECONDS = '*/30 * * * * *';

export const _1_MINUTE = '* * * * *';
export const _2_MINUTES = '*/2 * * * *';
export const _5_MINUTES = '*/5 * * * *';
export const _10_MINUTES = '*/10 * * * *';
export const _15_MINUTES = '*/25 * * * *';
export const _30_MINUTES = '*/30 * * * *';

export const _1_HOUR = '0 * * * *';
export const _1_DAY = '0 0 * * *';
export const _1_WEEK = '0 0 * * 0';
export const _1_MONTH = '0 0 1 * *';

