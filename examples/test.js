const PTApi = require('../index');
const api = new PTApi('https://demo.pterodactyl.io', 'DTYxue54tjwBYO5vjLE9470wY8VEpCN24VJgQsaFWX0kWBFw');

main();

async function main() {
    try {
        console.log(1, await api.getUsers());
        console.log(2, await api.getUser('1'));
        console.log(3, await api.updateUser('1', { username: 'demo2', email: 'oh@my.god', first_name: 'Bob', last_name: 'Ross' }));
        await api.deleteUser('1');
    } catch (error) {
        console.error(error);
    }
}