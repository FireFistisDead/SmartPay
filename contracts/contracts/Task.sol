// SPDX-License-Identifier: MIT

pragma solidity ^0.8.8;

contract Task {
    enum Status {
        Created,
        Assigned,
        Completed,
        Accepted,
        Rejected,
        Deleted
    }

    uint public id;
    string public title;
    string public description;
    uint public reward;
    address public creator;
    address public solver;
    Status public status;
    uint public createdAt = block.timestamp;
    uint public timeToComplete;
    string public majorTypeOfTask;
    string public minorTypeOfTask;
    string public teckStack;
    address[] public requestForTask;

    constructor(
        uint _id,
        string memory _title,
        string memory _description,
        uint _reward,
        address _creator,
        uint _timeToComplete,
        string memory _majorTypeOfTask,
        string memory _minorTypeOfTask,
        string memory _teckStack,
        address[] memory _requestForTask
    ) {
        id = _id;
        title = _title;
        description = _description;
        reward = _reward;
        creator = _creator;
        status = Status.Created;
        timeToComplete = _timeToComplete;
        majorTypeOfTask = _majorTypeOfTask;
        minorTypeOfTask = _minorTypeOfTask;
        teckStack = _teckStack;
        requestForTask = _requestForTask;
    }

    function assign(address _solver) external {
        require(tx.origin == creator, "Only creator can assign a task");
        require(status == Status.Created, "Task must be in Created status");
        solver = _solver;
        status = Status.Assigned;
    }

    function complete() external {
        require(tx.origin == solver, "Only solver can complete a task");
        require(status == Status.Assigned, "Task must be in Assigned status");
        status = Status.Completed;
    }

    function deleteTask() external {
        require(tx.origin == creator, "Only creator can delete a task");
        require(status == Status.Created, "Task must be in Created status");
        status = Status.Deleted;
    }

    function requestForTaskToCreator(address _requester) external {
        require(tx.origin != creator, "Creator can not request for a task");
        require(status == Status.Created, "Task must be in Created status");
        requestForTask.push(_requester);
    }

    function rejectForTaskByCreator(address _requester) external {
        require(tx.origin == creator, "Only creator can reject for a task");
        require(status == Status.Created, "Task must be in Created status");
        for (uint i = 0; i < requestForTask.length; i++) {
            if (requestForTask[i] == _requester) {
                delete requestForTask[i];
            }
        }
    }

    function acceptTaskForSolver(address _solver) external {
        require(tx.origin == creator, "Only creator can accept for a task");
        require(status == Status.Created, "Task must be in Created status");
        solver = _solver;
        status = Status.Assigned;
    }

    function getRequestForTaskOfIndex(
        uint _index
    ) external view returns (address) {
        return requestForTask[_index];
    }

    function getRequestForTaskLength() external view returns (uint) {
        return requestForTask.length;
    }

    function transferRewardToSolver() external {
        require(
            tx.origin == creator,
            "Only creator can transfer reward to solver"
        );
        require(status == Status.Completed, "Task must be in Completed status");
        payable(solver).transfer(reward);
        status = Status.Accepted;
    }
}
