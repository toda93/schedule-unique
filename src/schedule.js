import schedule from 'node-schedule';

let listJob = new Set();
export function scheduleUnique(name, rule, timeout, callback) {
    const currentJob = schedule.scheduledJobs[name];
    if (!currentJob) {
        schedule.scheduleJob(name, rule, () => {
            try {
                if (!listJob.has(name)) {
                    listJob.add(name);
                    Promise.race([
                        delay(timeout),
                        callback()
                    ]).then(result => {
                        listJob.delete(name);
                        if (result === 'timeout') {
                            process.kill(process.pid);
                        }
                    });
                }
            } catch (e) {
                console.error('error', e);
                process.exit(1);
            }
        });
    } else {
        throw `duplicate job ${name}`;
    }
}

function delay(timeout) {
    return new Promise((resolve, reject) => {
        let wait = setTimeout(() => {
            clearTimeout(wait);
            resolve('timeout')
        }, timeout * 1000)
    });
}