pragma solidity >=0.5.0;

interface IComponents {
    /**
    * @dev Returns the address of the indicator
    * @param isDefault Whether the indicator is a default indicator
    * @param index Index of the indicator in array of available indicators
    * @return address Address of the indicator
    */
    function getIndicatorFromIndex(bool isDefault, uint index) external view returns (address);

    /**
    * @dev Returns the address of the comparator
    * @param isDefault Whether the comparator is a default comparator
    * @param index Index of the comparator in array of available comparator
    * @return address Address of the comparator
    */
    function getComparatorFromIndex(bool isDefault, uint index) external view returns (address);

    /**
    * @dev Returns the address of each default indicator
    * @return address[] The addresses of available default indicators
    */
    function getDefaultIndicators() external view returns (address[] memory);

    /**
    * @dev Returns the address of each custom indicator
    * @return address[] The addresses of available custom indicators
    */
    function getIndicators() external view returns (address[] memory);

    /**
    * @dev Returns the address of each default comparator
    * @return address[] The addresses of available default comparator
    */
    function getDefaultComparators() external view returns (address[] memory);

    /**
    * @dev Returns the address of each custom comparator
    * @return address[] The addresses of available custom comparator
    */
    function getComparators() external view returns (address[] memory);

    /**
    * @dev Returns index of each indicator the user purchased
    * @param user Address of the user
    * @return uint[] The index in indicators array of each indicator the user purchased
    */
    function getUserPurchasedIndicators(address user) external view returns (uint[] memory);

    /**
    * @dev Returns index of each comparator the user purchased
    * @param user Address of the user
    * @return uint[] The index in comparators array of each comparator the user purchased
    */
    function getUserPurchasedComparators(address user) external view returns (uint[] memory);

    /**
    * @dev Checks whether the user purchased the given indicator
    * @param user Address of the user
    * @param indicatorIndex Index of the indicator in the indicators array
    * @return bool Whether the user purchased the given indicator
    */
    function checkIfUserPurchasedIndicator(address user, uint indicatorIndex) external view returns (bool);

    /**
    * @dev Checks whether the user purchased the given comparator
    * @param user Address of the user
    * @param comparatorIndex Index of the comparator in the comparators array
    * @return bool Whether the user purchased the given comparator
    */
    function checkIfUserPurchasedComparator(address user, uint comparatorIndex) external view returns (bool);

    /**
    * @dev Purchase the given indicator
    * @param indicatorAddress Address of the indicator to purchase
    */
    function buyIndicator(address indicatorAddress) external;

    /**
    * @dev Purchase the given comparator
    * @param comparatorAddress Address of the comparator to purchase
    */
    function buyComparator(address comparatorAddress) external;

    /**
    * @dev Adds a new indicator to the platform; meant to be called by the contract owner
    * @param isDefault Whether the added indicator is a default indicator
    * @param indicatorAddress Address of the contract where the indicator is implemented
    */
    function _addNewIndicator(bool isDefault, address indicatorAddress) external;

    /**
    * @dev Adds a new comparator to the platform; meant to be called by the contract owner
    * @param isDefault Whether the added comparator is a default comparator
    * @param comparatorAddress Address of the contract where the comparator is implemented
    */
    function _addNewComparator(bool isDefault, address comparatorAddress) external;

    /**
    * @dev Adds default indicators and comparators to the given user; meant to be called by the UserManager contract
    * @param user Address of user to add default indicators and comparators to
    */
    function _addDefaultComponentsToUser(address user) external;
}