import { ethers } from "ethers";

class ContractInteractions {
  constructor(config) {
    this.contractAddress = config.contractAddress;
    this.Task = config.Task;
    this.TaskHub = config.TaskHub;
    this.provider = new ethers.providers.Web3Provider(window.ethereum);
    this.TaskHubcontract = new ethers.Contract(
      this.contractAddress.localhost,
      this.TaskHub,
      this.provider.getSigner()
    );
    this.Taskcontract = new ethers.Contract(
      this.contractAddress.localhost,
      this.Task,
      this.provider.getSigner()
    );
  }

  wallet(account) {
    this.accountAddress = account;
  }

  async createTask(formData) {
    if (!this.accountAddress) {
      console.error("First Connect To Wallet");
      return "First Connect To Wallet";
    }
    const {
      title,
      description,
      reward,
      timeToComplete,
      majorTypeOfTask,
      minorTypeOfTask,
      techStack,
    } = formData;
    try {
      const tx = await this.TaskHubcontract.createTask(
        title,
        description,
        reward,
        timeToComplete,
        majorTypeOfTask,
        minorTypeOfTask,
        techStack
      );
    } catch (err) {
      console.log("Error during task creating : ", err.message);
      throw err;
    }
  }
  async getAllTasks() {
    if (!this.accountAddress) {
      console.error("First Connect To Wallet");
      return "First Connect To Wallet";
    }
    try {
      const task = await this.TaskHubcontract.getAllTasks();
      return task;
    } catch (err) {
      console.log("Error during calling all Tasks : ", err.message);
      throw err;
    }
  }

  async getTask(taskId) {
    if (!this.accountAddress) {
      console.error("First Connect To Wallet");
      return "First Connect To Wallet";
    }
    try {
      const task = await this.TaskHubcontract.getTask(taskId);
      return task;
    } catch (err) {
      console.log("Error during calling Task : ", err.message);
      throw err;
    }
  }

  async transferRewardToSolver(_id) {
    if (!this.accountAddress) {
      console.error("First Connect To Wallet");
      return "First Connect To Wallet";
    }
    try {
      const tx = await this.TaskHubcontract.transferRewardToSolver(_id);
      return tx;
    } catch (err) {
      console.log("Error during calling Task : ", err.message);
      throw err;
    }
  }

  async assignTask(_id, _solver) {
    if (!this.accountAddress) {
      console.error("First Connect To Wallet");
      return "First Connect To Wallet";
    }
    try {
      const tx = await this.TaskHubcontract.assignTask(_id, _solver);
      return tx;
    } catch (err) {
      console.log("Error during calling Task : ", err.message);
      throw err;
    }
  }

  async requestForTaskToCreator(_id) {
    if (!this.accountAddress) {
      console.error("First Connect To Wallet");
      return "First Connect To Wallet";
    }
    try {
      const tx = await this.TaskHubcontract.requestForTaskToCreator(_id);
      return tx;
    } catch (err) {
      console.log("Error during calling Task : ", err.message);
      throw err;
    }
  }

  async rejectForTaskByCreator(_id, _solver) {
    if (!this.accountAddress) {
      console.error("First Connect To Wallet");
      return "First Connect To Wallet";
    }
    try {
      const tx = await this.TaskHubcontract.rejectForTaskByCreator(
        _id,
        _solver
      );
      return tx;
    } catch (err) {
      console.log("Error during calling Task : ", err.message);
      throw err;
    }
  }

  async acceptTaskForSolver(_id, _solver) {
    if (!this.accountAddress) {
      console.error("First Connect To Wallet");
      return "First Connect To Wallet";
    }
    try {
      const tx = await this.TaskHubcontract.acceptTaskForSolver(_id, _solver);
      return tx;
    } catch (err) {
      console.log("Error during calling Task : ", err.message);
      throw err;
    }
  }

  async completeTask(_id) {
    if (!this.accountAddress) {
      console.error("First Connect To Wallet");
      return "First Connect To Wallet";
    }
    try {
      const tx = await this.TaskHubcontract.completeTask(_id);
      return tx;
    } catch (err) {
      console.log("Error during calling Task : ", err.message);
      throw err;
    }
  }
  async deleteTask(_id) {
    if (!this.accountAddress) {
      console.error("First Connect To Wallet");
      return "First Connect To Wallet";
    }
    try {
      const tx = await this.TaskHubcontract.deleteTask(_id);
      return tx;
    } catch (err) {
      console.log("Error during calling Task : ", err.message);
      throw err;
    }
  }

  async getTaskCount() {
    try {
      const taskCount = await this.TaskHubcontract.getTaskCount();
      return taskCount;
    } catch (err) {
      console.log("Error during calling Task Count : ", err.message);
      throw err;
    }
  }
  async getTaskStatus(_id) {
    try {
      const taskStatus = await this.TaskHubcontract.getTaskStatus(_id);
      return taskStatus;
    } catch (err) {
      console.log("Error during calling Task Status : ", err.message);
      throw err;
    }
  }

  async getTaskSolver(_id) {
    try {
      const taskSolver = await this.TaskHubcontract.getTaskSolver(_id);
      return taskSolver;
    } catch (err) {
      console.log("Error during calling Task Solver : ", err.message);
      throw err;
    }
  }

  async getTaskCreator(_id) {
    try {
      const taskCreator = await this.TaskHubcontract.getTaskCreator(_id);
      return taskCreator;
    } catch (err) {
      console.log("Error during calling Task Creator : ", err.message);
      throw err;
    }
  }

  async getTaskReward(_id) {
    try {
      const taskReward = await this.TaskHubcontract.getTaskReward(_id);
      return taskReward;
    } catch (err) {
      console.log("Error during calling Task Reward : ", err.message);
      throw err;
    }
  }

  async getTaskTimeToComplete(_id) {
    try {
      const taskTimeToComplete =
        await this.TaskHubcontract.getTaskTimeToComplete(_id);
      return taskTimeToComplete;
    } catch (err) {
      console.log("Error during calling Task Time To Complete : ", err.message);
      throw err;
    }
  }

  async getTaskCreatedAt(_id) {
    try {
      const taskCreatedAt = await this.TaskHubcontract.getTaskCreatedAt(_id);
      return taskCreatedAt;
    } catch (err) {
      console.log("Error during calling Task Created At : ", err.message);
      throw err;
    }
  }

  async getTaskTitle(_id) {
    try {
      const taskTitle = await this.TaskHubcontract.getTaskTitle(_id);
      return taskTitle;
    } catch (err) {
      console.log("Error during calling Task Title : ", err.message);
      throw err;
    }
  }

  async getTaskDescription(_id) {
    try {
      const taskDescription = await this.TaskHubcontract.getTaskDescription(
        _id
      );
      return taskDescription;
    } catch (err) {
      console.log("Error during calling Task Description : ", err.message);
      throw err;
    }
  }

  async getTaskCreatorAddress(_id) {
    try {
      const taskCreatorAddress =
        await this.TaskHubcontract.getTaskCreatorAddress(_id);
      return taskCreatorAddress;
    } catch (err) {
      console.log("Error during calling Task Creator Address : ", err.message);
      throw err;
    }
  }

  async getTaskMajorTypeOfTask(_id) {
    try {
      const taskMajorTypeOfTask =
        await this.TaskHubcontract.getTaskMajorTypeOfTask(_id);
      return taskMajorTypeOfTask;
    } catch (err) {
      console.log(
        "Error during calling Task Major Type Of Task : ",
        err.message
      );
      throw err;
    }
  }

  async getTaskMinorTypeOfTask(_id) {
    try {
      const taskMinorTypeOfTask =
        await this.TaskHubcontract.getTaskMinorTypeOfTask(_id);
      return taskMinorTypeOfTask;
    } catch (err) {
      console.log(
        "Error during calling Task Minor Type Of Task : ",
        err.message
      );
      throw err;
    }
  }

  async getTaskTeckStack(_id) {
    try {
      const taskTeckStack = await this.TaskHubcontract.getTaskTeckStack(_id);
      return taskTeckStack;
    } catch (err) {
      console.log("Error during calling Task Teck Stack : ", err.message);
      throw err;
    }
  }

  async getTaskRequestForTaskByUser(_id) {
    try {
      const taskRequestForTaskByUser =
        await this.TaskHubcontract.getTaskRequestForTaskByUser(_id);
      return taskRequestForTaskByUser;
    } catch (err) {
      console.log(
        "Error during calling Task Request For Task By User : ",
        err.message
      );
      throw err;
    }
  }

  async getAllTasksByCreator(_creator) {
    try {
      const task = await this.TaskHubcontract.getAllTasksByCreator(_creator);
      return task;
    } catch (err) {
      console.log("Error during calling all Tasks : ", err.message);
      throw err;
    }
  }

  async getAllTasksBySolver(_solver) {
    try {
      const task = await this.TaskHubcontract.getAllTasksBySolver(_solver);
      return task;
    } catch (err) {
      console.log("Error during calling all Tasks : ", err.message);
      throw err;
    }
  }

  async getAllTasksByStatus(_status) {
    try {
      const task = await this.TaskHubcontract.getAllTasksByStatus(_status);
      return task;
    } catch (err) {
      console.log("Error during calling all Tasks : ", err.message);
      throw err;
    }
  }

  async getAllTasksByCreatorAndStatus(_creator, _status) {
    try {
      const task = await this.TaskHubcontract.getAllTasksByCreatorAndStatus(
        _creator,
        _status
      );
      return task;
    } catch (err) {
      console.log("Error during calling all Tasks : ", err.message);
      throw err;
    }
  }

  async getAllTasksBySolverAndStatus(_solver, _status) {
    try {
      const task = await this.TaskHubcontract.getAllTasksBySolverAndStatus(
        _solver,
        _status
      );
      return task;
    } catch (err) {
      console.log("Error during calling all Tasks : ", err.message);
      throw err;
    }
  }

  async getAllTasksByCreatorAndSolver(_creator, _solver) {
    try {
      const task = await this.TaskHubcontract.getAllTasksByCreatorAndSolver(
        _creator,
        _solver
      );
      return task;
    } catch (err) {
      console.log("Error during calling all Tasks : ", err.message);
      throw err;
    }
  }

  async getTaskByrequestForTask(_requestForTask) {
    try {
      const task = await this.TaskHubcontract.getTaskByrequestForTask(
        _requestForTask
      );
      return task;
    } catch (err) {
      console.log("Error during calling all Tasks : ", err.message);
      throw err;
    }
  }

  async getAllrequestForTaskByTask(_id) {
    try {
      const _id_to_number = Number(_id);
      const task = await this.TaskHubcontract.getAllrequestForTaskByTask(
        _id_to_number
      );
      return task;
    } catch (err) {
      console.log("Error during calling all Tasks : ", err.message);
      throw err;
    }
  }

  async getAllTaskByNinorTypeOfTask(_minorTypeOfTask) {
    try {
      const task = await this.TaskHubcontract.getAllTaskByNinorTypeOfTask(
        _minorTypeOfTask
      );
      return task;
    } catch (err) {
      console.log("Error during calling all Tasks : ", err.message);
      throw err;
    }
  }
}

export default ContractInteractions;
