pragma solidity >=0.5.0;

contract UserManager {

    struct User {
        uint memberSinceTimestamp;
        string username;
    }

    mapping (address => User) public users;
    mapping (string => address) public usernames;

    constructor() public {}

    /* ========== VIEWS ========== */

    /**
    * @dev Returns the timestamp and username of the given user
    * @param user Address of the user
    * @return User The timestamp and username of the user
    */
    function getUser(address user) external view userExists(user) returns(uint, string memory) {
        return (users[user].memberSinceTimestamp, users[user].username);
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
    * @dev Changes the user's username to the new username
    * @param newUsername New username for the user
    */
    function editUsername(string memory newUsername) external userExists(msg.sender) {
        require(users[msg.sender].memberSinceTimestamp > 0, "User not registered");
        require(usernames[newUsername] == address(0), "Username already exists");
        require(bytes(newUsername).length > 0, "Username cannot be empty string");
        require(bytes(newUsername).length <= 30, "Username cannot have more than 30 characters");

        string memory oldUsername = users[msg.sender].username;
        users[msg.sender].username = newUsername;
        delete usernames[oldUsername];
        usernames[newUsername] = msg.sender;

        emit UpdatedUsername(msg.sender, newUsername, block.timestamp);
    }

    /**
    * @dev Registers a new user to the platform
    * @param defaultRandomUsername Default username created for the user; username is generated on frontend
    */
    function registerUser(string memory defaultRandomUsername) external {
        require(users[msg.sender].memberSinceTimestamp == 0, "User already exists");
        require(bytes(defaultRandomUsername).length > 0, "Username cannot be empty string");
        require(bytes(defaultRandomUsername).length <= 30, "Username cannot have more than 30 characters");
        require(usernames[defaultRandomUsername] == address(0), "Username already exists");

        usernames[defaultRandomUsername] = msg.sender;
        users[msg.sender] = User(block.timestamp, defaultRandomUsername);

        emit RegisteredUser(msg.sender, block.timestamp);
    }

    /* ========== MODIFIERS ========== */

    modifier userExists(address user) {
        require(user != address(0), "Invalid user address");
        require(users[user].memberSinceTimestamp > 0, "User not found");
        _;
    }

    /* ========== EVENTS ========== */

    event UpdatedUsername(address indexed user, string newUsername, uint timestamp);
    event RegisteredUser(address indexed user, uint timestamp);
}