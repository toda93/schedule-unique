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


    addSchedule(name, rule, timeout, callback) {
        if (
            (!!process.env.instances && this.countSchedule % process.env.instances === process.env.pm_id) ||
            (process.env.NODE_APP_INSTANCE === '0')
        ) {
            this.run(name, rule, timeout, callback);
        }
        this.countSchedule++;

    }

    run(name, rule, timeout, callback) {
        const currentJob = schedule.scheduledJobs[name];
        if (!currentJob) {
            schedule.scheduleJob(name, rule, () => {
                try {
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
                            this.listJob.delete(name);
                        });
                    } else {
                        console.info(`duplicate job ${name}`);
                    }
                } catch (err) {
                    console.error('error', err);
                    process.kill(process.pid);
                }
            });
        } 
    }
}

export default new ScheduleUniqueProvider;
