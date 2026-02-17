// SPDX-License-Identifier: MIT

pragma solidity ^0.8.8;

import "./Task.sol";

contract TaskHub {
    uint public taskCount = 0;
    mapping(uint => Task) public tasks;

    event TaskCreated(
        uint id,
        string title,
        string description,
        uint reward,
        address creator,
        uint timeToComplete,
        string majorTypeOfTask,
        string minorTypeOfTask,
        string teckStack,
        address[] requestForTask
    );

    event TaskAssigned(uint id, address solver);

    event TaskCompleted(uint id);

    event TaskAccepted(uint id);

    event TaskRejected(uint id);

    event TaskRequestForTaskToCreator(uint id);

    event TaskDeleted(uint id);

    event TaskRewardTransferredToSolver(uint id);

    function transferRewardToSolver(uint _id) external payable {
        Task task = tasks[_id];
        require(
            msg.sender == task.creator(),
            "Only creator can transfer reward to solver"
        );
        require(
            task.status() == Task.Status.Completed,
            "Task must be in Completed status"
        );
        task.transferRewardToSolver();
        emit TaskRewardTransferredToSolver(_id);
    }

    function createTask(
        string memory _title,
        string memory _description,
        uint _reward,
        uint _timeToComplete,
        string memory _majorTypeOfTask,
        string memory _minorTypeOfTask,
        string memory _teckStack
    ) external {
        taskCount++;
        address[] memory _requestForTask = new address[](0);
        tasks[taskCount] = new Task(
            taskCount,
            _title,
            _description,
            _reward,
            msg.sender,
            _timeToComplete,
            _majorTypeOfTask,
            _minorTypeOfTask,
            _teckStack,
            _requestForTask
        );
        emit TaskCreated(
            taskCount,
            _title,
            _description,
            _reward,
            msg.sender,
            _timeToComplete,
            _majorTypeOfTask,
            _minorTypeOfTask,
            _teckStack,
            new address[](0)
        );
    }

    function assignTask(uint _id, address _solver) external {
        Task task = tasks[_id];
        require(msg.sender == task.creator(), "Only creator can assign a task");
        require(
            task.status() == Task.Status.Created,
            "Task must be in Created status"
        );
        task.assign(_solver);
        emit TaskAssigned(_id, _solver);
    }

    function requestForTaskToCreator(uint _id) external {
        Task task = tasks[_id];
        require(
            msg.sender != task.creator(),
            "Creator can not request for task to creator"
        );
        require(
            task.status() == Task.Status.Created,
            "Task must be in Created status"
        );
        task.requestForTaskToCreator(msg.sender);
        emit TaskRequestForTaskToCreator(_id);
    }

    function rejectForTaskByCreator(uint _id, address _solver) external {
        Task task = tasks[_id];
        require(msg.sender == task.creator(), "Only creator can reject a task");
        require(
            task.status() == Task.Status.Created,
            "Task must be in Created status"
        );
        task.rejectForTaskByCreator(_solver);
        emit TaskRejected(_id);
    }

    function acceptTaskForSolver(uint _id, address _solver) external {
        Task task = tasks[_id];
        require(msg.sender == task.creator(), "Only creator can accept a task");
        require(
            task.status() == Task.Status.Created,
            "Task must be in Created status"
        );
        task.acceptTaskForSolver(_solver);
        emit TaskAccepted(_id);
    }

    function completeTask(uint _id) external {
        Task task = tasks[_id];
        require(msg.sender == task.solver(), "Only solver can complete a task");
        require(
            task.status() == Task.Status.Assigned,
            "Task must be in Assigned status"
        );
        task.complete();
        emit TaskCompleted(_id);
    }

    function deleteTask(uint _id) external {
        Task task = tasks[_id];
        require(msg.sender == task.creator(), "Only creator can delete a task");
        require(
            task.status() == Task.Status.Created,
            "Task must be in Created status"
        );
        task.deleteTask();
        emit TaskDeleted(_id);
    }

    function getTask(
        uint _id
    )
        external
        view
        returns (
            uint[4] memory all_integer_data,
            address[3] memory all_address_data,
            string[5] memory all_string_data,
            bool isUserRequestForTask
        )
    {
        Task task = tasks[_id];
        all_integer_data[0] = task.id();
        all_integer_data[1] = task.reward();
        all_integer_data[2] = task.createdAt();
        all_integer_data[3] = task.timeToComplete();
        all_address_data[0] = task.creator();
        all_address_data[1] = task.solver();
        all_address_data[2] = msg.sender;
        all_string_data[0] = task.title();
        all_string_data[1] = task.description();
        all_string_data[2] = task.majorTypeOfTask();
        all_string_data[3] = task.minorTypeOfTask();
        all_string_data[4] = task.teckStack();
        isUserRequestForTask = false;
        for (uint i = 0; i < task.getRequestForTaskLength(); i++) {
            if (task.getRequestForTaskOfIndex(i) == msg.sender) {
                isUserRequestForTask = true;
            }
        }
    }

    function getTaskCount() external view returns (uint) {
        return taskCount;
    }

    function getTaskStatus(uint _id) external view returns (Task.Status) {
        Task task = tasks[_id];
        return task.status();
    }

    function getTaskSolver(uint _id) external view returns (address) {
        Task task = tasks[_id];
        return task.solver();
    }

    function getTaskCreator(uint _id) external view returns (address) {
        Task task = tasks[_id];
        return task.creator();
    }

    function getTaskReward(uint _id) external view returns (uint) {
        Task task = tasks[_id];
        return task.reward();
    }

    function getTaskTimeToComplete(uint _id) external view returns (uint) {
        Task task = tasks[_id];
        return task.timeToComplete();
    }

    function getTaskCreatedAt(uint _id) external view returns (uint) {
        Task task = tasks[_id];
        return task.createdAt();
    }

    function getTaskTitle(uint _id) external view returns (string memory) {
        Task task = tasks[_id];
        return task.title();
    }

    function getTaskDescription(
        uint _id
    ) external view returns (string memory) {
        Task task = tasks[_id];
        return task.description();
    }

    function getTaskSolverAddress(uint _id) external view returns (address) {
        Task task = tasks[_id];
        return task.solver();
    }

    function getTaskCreatorAddress(uint _id) external view returns (address) {
        Task task = tasks[_id];
        return task.creator();
    }

    function getTaskMajorTypeOfTask(
        uint _id
    ) external view returns (string memory) {
        Task task = tasks[_id];
        return task.majorTypeOfTask();
    }

    function getTaskMinorTypeOfTask(
        uint _id
    ) external view returns (string memory) {
        Task task = tasks[_id];
        return task.minorTypeOfTask();
    }

    function getTaskTeckStack(uint _id) external view returns (string memory) {
        Task task = tasks[_id];
        return task.teckStack();
    }

    function getTaskRequestForTaskByUser(
        uint _id
    ) external view returns (bool isUserRequestForTask) {
        Task task = tasks[_id];
        isUserRequestForTask = false;
        for (uint i = 0; i < task.getRequestForTaskLength(); i++) {
            if (task.requestForTask(i) == msg.sender) {
                isUserRequestForTask = true;
            }
        }
    }

    function getAllTasks() external view returns (Task[] memory) {
        Task[] memory _tasks = new Task[](taskCount);

        uint counter = 0;
        for (uint i = 1; i <= taskCount; i++) {
            if (tasks[i].status() != Task.Status.Deleted) {
                _tasks[i - 1] = tasks[i];
                counter++;
            }
        }

        Task[] memory _allTasks = new Task[](counter);
        for (uint i = 0; i < counter; i++) {
            _allTasks[i] = _tasks[i];
        }
        return _allTasks;
    }

    function getAllTasksByCreator(
        address _creator
    ) external view returns (Task[] memory) {
        Task[] memory _tasks = new Task[](taskCount);
        uint counter = 0;
        for (uint i = 1; i <= taskCount; i++) {
            if (tasks[i].creator() == _creator) {
                _tasks[counter] = tasks[i];
                counter++;
            }
        }
        Task[] memory _tasksByCreator = new Task[](counter);
        for (uint i = 0; i < counter; i++) {
            _tasksByCreator[i] = _tasks[i];
        }
        return _tasksByCreator;
    }

    function getAllTasksBySolver(
        address _solver
    ) external view returns (Task[] memory) {
        Task[] memory _tasks = new Task[](taskCount);
        uint counter = 0;
        for (uint i = 1; i <= taskCount; i++) {
            if (tasks[i].solver() == _solver) {
                _tasks[counter] = tasks[i];
                counter++;
            }
        }
        Task[] memory _tasksBySolver = new Task[](counter);
        for (uint i = 0; i < counter; i++) {
            _tasksBySolver[i] = _tasks[i];
        }
        return _tasksBySolver;
    }

    function getAllTasksByStatus(
        Task.Status _status
    ) external view returns (Task[] memory) {
        Task[] memory _tasks = new Task[](taskCount);
        uint counter = 0;
        for (uint i = 1; i <= taskCount; i++) {
            if (tasks[i].status() == _status) {
                _tasks[counter] = tasks[i];
                counter++;
            }
        }
        Task[] memory _tasksByStatus = new Task[](counter);
        for (uint i = 0; i < counter; i++) {
            _tasksByStatus[i] = _tasks[i];
        }
        return _tasksByStatus;
    }

    function getAllTasksByCreatorAndStatus(
        address _creator,
        Task.Status _status
    ) external view returns (Task[] memory) {
        Task[] memory _tasks = new Task[](taskCount);
        uint counter = 0;
        for (uint i = 1; i <= taskCount; i++) {
            if (
                tasks[i].creator() == _creator && tasks[i].status() == _status
            ) {
                _tasks[counter] = tasks[i];
                counter++;
            }
        }
        Task[] memory _tasksByCreatorAndStatus = new Task[](counter);
        for (uint i = 0; i < counter; i++) {
            _tasksByCreatorAndStatus[i] = _tasks[i];
        }
        return _tasksByCreatorAndStatus;
    }

    function getAllTasksBySolverAndStatus(
        address _solver,
        Task.Status _status
    ) external view returns (Task[] memory) {
        Task[] memory _tasks = new Task[](taskCount);
        uint counter = 0;
        for (uint i = 1; i <= taskCount; i++) {
            if (tasks[i].solver() == _solver && tasks[i].status() == _status) {
                _tasks[counter] = tasks[i];
                counter++;
            }
        }
        Task[] memory _tasksBySolverAndStatus = new Task[](counter);
        for (uint i = 0; i < counter; i++) {
            _tasksBySolverAndStatus[i] = _tasks[i];
        }
        return _tasksBySolverAndStatus;
    }

    function getAllTasksByCreatorAndSolver(
        address _creator,
        address _solver
    ) external view returns (Task[] memory) {
        Task[] memory _tasks = new Task[](taskCount);
        uint counter = 0;
        for (uint i = 1; i <= taskCount; i++) {
            if (
                tasks[i].creator() == _creator && tasks[i].solver() == _solver
            ) {
                _tasks[counter] = tasks[i];
                counter++;
            }
        }
        Task[] memory _tasksByCreatorAndSolver = new Task[](counter);
        for (uint i = 0; i < counter; i++) {
            _tasksByCreatorAndSolver[i] = _tasks[i];
        }
        return _tasksByCreatorAndSolver;
    }

    function getTaskByrequestForTask(
        address _requestForTask
    ) external view returns (Task[] memory) {
        Task[] memory _tasks = new Task[](taskCount);
        uint counter = 0;
        for (uint i = 1; i <= taskCount; i++) {
            for (uint j = 0; j < tasks[i].getRequestForTaskLength(); j++) {
                if (tasks[i].getRequestForTaskOfIndex(j) == _requestForTask) {
                    _tasks[counter] = tasks[i];
                    counter++;
                }
            }
        }
        Task[] memory _tasksByrequestForTask = new Task[](counter);
        for (uint i = 0; i < counter; i++) {
            _tasksByrequestForTask[i] = _tasks[i];
        }
        return _tasksByrequestForTask;
    }

    function getAllrequestForTaskByTask(
        uint256 _id
    ) external view returns (address[10] memory) {
        Task task = tasks[_id];
        address[10] memory all_address;
        for (uint256 i = 0; i < task.getRequestForTaskLength(); i++) {
            address userAddress = task.getRequestForTaskOfIndex(i);
            all_address[i] = userAddress;
        }
        return all_address;
    }

    function getAllTaskByNinorTypeOfTask(
        string memory _minorTypeOfTask
    ) external view returns (Task[] memory, uint256[] memory) {
        Task[] memory _tasks = new Task[](taskCount);
        uint counter = 0;
        for (uint i = 1; i <= taskCount; i++) {
            if (
                keccak256(abi.encodePacked(tasks[i].minorTypeOfTask())) ==
                keccak256(abi.encodePacked(_minorTypeOfTask))
            ) {
                _tasks[counter] = tasks[i];
                counter++;
            }
        }
        Task[] memory _tasksByNinorTypeOfTask = new Task[](counter);
        uint256[] memory _tasksByNinorTypeOfTaskId = new uint256[](counter);
        for (uint i = 0; i < counter; i++) {
            _tasksByNinorTypeOfTask[i] = _tasks[i];
            _tasksByNinorTypeOfTaskId[i] = _tasks[i].id();
        }
        return (_tasksByNinorTypeOfTask, _tasksByNinorTypeOfTaskId);
    }
}
