//Keeping track of users in an array

//Declare the fns here, then integrate them in index.js by exporting

const users = [];

const addUser = ({ id, username, room }) => { //username n room comes from client, take id as number for now
    //Clean(format, trim, validate) the data(id, username, room)

    username = username.trim().toLowerCase();//So there will be no two same usernames/rooms in upper n lower case
    room = room.trim().toLowerCase();

    if (!username || !room) {//Validating - if there is no username n room(empty)
        return {
            error: 'Username and room are required!'
        }
    }

    const existingUser = users.find((user) => {//Trying to find a match for each user from users array, return true if we found the match

        //check if username already exist in the room user wants to join. 
        //i.e same room && same username both needs to be true, so existingUser is true.
        return user.room === room && user.username === username;
    });

    //If user exists, show error
    if (existingUser) {
        return {
            error: 'Username is already in use!'
        }
    }

    //If everything is valid, then we need to store them
    const user = { id, username, room };
    users.push(user);
    return { user };
}


//removeUser - stop tracking a user when user leaves
const removeUser = (id) => {//based on id of user, remove user
    //To find user in an array using his id 
    const index = users.findIndex((user) => { // index stores -1 for no match, 0 or 0< if there is a match
        return user.id === id;
    });
    //above index can also written in shrothand syntax
    //const index = users.findIndex((user) => user.id === id );

    //If match found, remove the user
    if (index !== -1) {
        //Using filter() keep runs even after match found, but splice() stops searching after match found
        //splice(i,c) - remove an item in an array by index, at wch index(i) start removing n how many items(c) need to removed from i
        return users.splice(index, 1)[0];//returns array of removed user objs, here we remove only one, so return 0 index value
    }
}


//getUser - to fetch existing user data
const getUser = (id) => {
    return users.find((user) => user.id === id);//retruns undefined if no match
};


//getUsersInRoom - to fetch all users data in a spcific room(used to show them in sidebar)
const getUsersInRoom = (room) => {
    room = room.trim().toLowerCase();//to match room in any format
    //Using filter() keep runs even after match found, returns all users matches room
    return users.filter((user) => user.room === room);//retruns [] if no match
}


module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}
