import { scheduleUnique } from './schedule';

scheduleUnique('test', '* * * * *', 60 * 60, async () => {
    console.log('test');
});
