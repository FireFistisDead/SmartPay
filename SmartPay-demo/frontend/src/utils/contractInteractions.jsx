import { ethers } from "ethers";

class ContractInteractions {
  constructor(config) {
    // DEMO MODE: Initialize without requiring actual blockchain connection
    console.log("DEMO MODE: Initializing contract interactions (no blockchain required)");
    
    this.contractAddress = config.contractAddress;
    this.Task = config.Task;
    this.TaskHub = config.TaskHub;
    this.demoMode = true;
    
    // Load existing tasks from localStorage or initialize with sample tasks
    this.loadDemoTasks();
    
    // Only create provider if window.ethereum exists, but don't fail if it doesn't
    try {
      if (window.ethereum) {
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
    } catch (err) {
      console.log("DEMO MODE: No Web3 provider, using mock data only");
    }
  }

  loadDemoTasks() {
    try {
      const stored = localStorage.getItem('smartpay_demo_tasks');
      if (stored) {
        const data = JSON.parse(stored);
        this.demoTasks = data.tasks || [];
        this.demoTaskCounter = data.counter || 0;
        console.log(`DEMO MODE: Loaded ${this.demoTasks.length} tasks from storage`);
      } else {
        // Initialize with sample tasks
        this.demoTasks = [
          {
            id: 1,
            title: "E-commerce Website Development",
            description: "Build a full-stack e-commerce platform with payment integration, user authentication, and admin dashboard.",
            reward: 8,
            creator: "0xDemoCreator1",
            solver: "0x0000000000000000000000000000000000000000",
            status: 0,
            createdAt: Date.now() - 86400000,
            timeToComplete: 14,
            majorTypeOfTask: "Development",
            minorTypeOfTask: "website-making",
            teckStack: "React, Node.js, MongoDB, Stripe",
            requestForTask: []
          },
          {
            id: 2,
            title: "Mobile App UI/UX Design",
            description: "Design a modern, user-friendly mobile app interface for a fitness tracking application.",
            reward: 5,
            creator: "0xDemoCreator2",
            solver: "0x0000000000000000000000000000000000000000",
            status: 0,
            createdAt: Date.now() - 172800000,
            timeToComplete: 7,
            majorTypeOfTask: "Design",
            minorTypeOfTask: "mobile-app-design",
            teckStack: "Figma, Adobe XD, Sketch",
            requestForTask: []
          },
          {
            id: 3,
            title: "Company Logo Design",
            description: "Create a professional logo for a tech startup. Should be modern, memorable, and scalable.",
            reward: 3,
            creator: "0xDemoCreator3",
            solver: "0x0000000000000000000000000000000000000000",
            status: 0,
            createdAt: Date.now() - 259200000,
            timeToComplete: 5,
            majorTypeOfTask: "Design",
            minorTypeOfTask: "logo-design",
            teckStack: "Adobe Illustrator, Photoshop",
            requestForTask: []
          }
        ];
        this.demoTaskCounter = 3;
        this.saveDemoTasks();
        console.log("DEMO MODE: Initialized with sample tasks");
      }
    } catch (err) {
      console.error("Error loading demo tasks:", err);
      this.demoTasks = [];
      this.demoTaskCounter = 0;
    }
  }

  saveDemoTasks() {
    try {
      localStorage.setItem('smartpay_demo_tasks', JSON.stringify({
        tasks: this.demoTasks,
        counter: this.demoTaskCounter
      }));
      console.log(`DEMO MODE: Saved ${this.demoTasks.length} tasks to storage`);
    } catch (err) {
      console.error("Error saving demo tasks:", err);
    }
  }

  wallet(account) {
    this.accountAddress = account || "0xDemoWallet";
    console.log("DEMO MODE: Wallet set to", this.accountAddress);
  }

  async createTask(formData) {
    // DEMO MODE: Create and store task in localStorage
    console.log("DEMO MODE: Creating task without wallet requirement");
    
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
      // Create new task object
      this.demoTaskCounter++;
      const newTask = {
        id: this.demoTaskCounter,
        title,
        description,
        reward: Number(reward),
        creator: this.accountAddress || "0xDemoCreator",
        solver: "0x0000000000000000000000000000000000000000",
        status: 0, // Created status
        createdAt: Date.now(),
        timeToComplete: Number(timeToComplete),
        majorTypeOfTask,
        minorTypeOfTask,
        teckStack: techStack,
        requestForTask: []
      };
      
      // Add to tasks array
      this.demoTasks.push(newTask);
      
      // Save to localStorage
      this.saveDemoTasks();
      
      console.log("DEMO MODE: Task created and saved:", newTask);
      
      return { success: true, demo: true, taskId: newTask.id };
    } catch (err) {
      console.log("Error during task creating : ", err.message);
      throw err;
    }
  }
  async getAllTasks() {
    // DEMO MODE: Return tasks from localStorage
    console.log(`DEMO MODE: Returning ${this.demoTasks.length} tasks from storage`);
    
    try {
      // Reload from storage to get latest tasks
      this.loadDemoTasks();
      return this.demoTasks;
    } catch (err) {
      console.log("Error during calling all Tasks : ", err.message);
      return [];
    }
  }

  async getTask(taskId) {
    // DEMO MODE: Return mock task data
    console.log("DEMO MODE: Getting task", taskId);
    
    try {
      return {
        id: taskId,
        title: "Demo Task",
        description: "This is a demo task",
        reward: 5,
        creator: this.accountAddress || "0xDemoCreator",
        solver: "0x0000000000000000000000000000000000000000",
        status: 0,
        createdAt: Date.now(),
        timeToComplete: 7,
        majorTypeOfTask: "Design",
        minorTypeOfTask: "website-design",
        teckStack: "HTML, CSS, JavaScript",
        requestForTask: []
      };
    } catch (err) {
      console.log("Error during calling Task : ", err.message);
      return null;
    }
  }

  async transferRewardToSolver(_id) {
    // DEMO MODE: Simulate reward transfer
    console.log("DEMO MODE: Transferring reward for task", _id);
    try {
      return { success: true, demo: true };
    } catch (err) {
      console.log("Error during calling Task : ", err.message);
      return { success: false };
    }
  }

  async assignTask(_id, _solver) {
    // DEMO MODE: Simulate task assignment
    console.log("DEMO MODE: Assigning task", _id, "to", _solver);
    try {
      return { success: true, demo: true };
    } catch (err) {
      console.log("Error during calling Task : ", err.message);
      return { success: false };
    }
  }

  async requestForTaskToCreator(_id) {
    // DEMO MODE: Simulate request
    console.log("DEMO MODE: Requesting task", _id);
    try {
      return { success: true, demo: true };
    } catch (err) {
      console.log("Error during calling Task : ", err.message);
      return { success: false };
    }
  }

  async rejectForTaskByCreator(_id, _solver) {
    // DEMO MODE: Simulate rejection
    console.log("DEMO MODE: Rejecting request for task", _id);
    try {
      return { success: true, demo: true };
    } catch (err) {
      console.log("Error during calling Task : ", err.message);
      return { success: false };
    }
  }

  async acceptTaskForSolver(_id, _solver) {
    // DEMO MODE: Simulate acceptance
    console.log("DEMO MODE: Accepting solver for task", _id);
    try {
      return { success: true, demo: true };
    } catch (err) {
      console.log("Error during calling Task : ", err.message);
      return { success: false };
    }
  }

  async completeTask(_id) {
    // DEMO MODE: Simulate task completion
    console.log("DEMO MODE: Completing task", _id);
    try {
      return { success: true, demo: true };
    } catch (err) {
      console.log("Error during calling Task : ", err.message);
      return { success: false };
    }
  }
  async deleteTask(_id) {
    // DEMO MODE: Simulate task deletion
    console.log("DEMO MODE: Deleting task", _id);
    try {
      return { success: true, demo: true };
    } catch (err) {
      console.log("Error during calling Task : ", err.message);
      return { success: false };
    }
  }

  async getTaskCount() {
    // DEMO MODE: Return mock task count
    console.log("DEMO MODE: Getting task count");
    try {
      return 1;
    } catch (err) {
      console.log("Error during calling Task Count : ", err.message);
      return 0;
    }
  }
  async getTaskStatus(_id) {
    // DEMO MODE: Return mock status
    console.log("DEMO MODE: Getting task status", _id);
    try {
      return 0; // Created status
    } catch (err) {
      console.log("Error during calling Task Status : ", err.message);
      return 0;
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
    // DEMO MODE: Return mock tasks for creator
    console.log("DEMO MODE: Getting tasks by creator", _creator);
    try {
      return [];
    } catch (err) {
      console.log("Error during calling all Tasks : ", err.message);
      return [];
    }
  }

  async getAllTasksBySolver(_solver) {
    // DEMO MODE: Return empty array for solver tasks
    console.log("DEMO MODE: Getting tasks by solver", _solver);
    try {
      return [];
    } catch (err) {
      console.log("Error during calling all Tasks : ", err.message);
      return [];
    }
  }

  async getAllTasksByStatus(_status) {
    // DEMO MODE: Return mock tasks by status
    console.log("DEMO MODE: Getting tasks by status", _status);
    try {
      return [];
    } catch (err) {
      console.log("Error during calling all Tasks : ", err.message);
      return [];
    }
  }

  async getAllTasksByCreatorAndStatus(_creator, _status) {
    // DEMO MODE: Return empty array
    console.log("DEMO MODE: Getting tasks by creator and status");
    try {
      return [];
    } catch (err) {
      console.log("Error during calling all Tasks : ", err.message);
      return [];
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
    // DEMO MODE: Return empty array for requests
    console.log("DEMO MODE: Getting requests for task", _id);
    try {
      return [];
    } catch (err) {
      console.log("Error during calling all Tasks : ", err.message);
      return [];
    }
  }

  async getAllTaskByNinorTypeOfTask(_minorTypeOfTask) {
    // DEMO MODE: Return tasks filtered by minor type from localStorage
    console.log("DEMO MODE: Getting tasks by minor type:", _minorTypeOfTask);
    
    try {
      // Reload from storage
      this.loadDemoTasks();
      
      // Filter tasks by minor type
      const filteredTasks = this.demoTasks.filter(
        task => task.minorTypeOfTask === _minorTypeOfTask
      );
      
      console.log(`Found ${filteredTasks.length} tasks for ${_minorTypeOfTask}`);
      return filteredTasks;
    } catch (err) {
      console.log("Error during calling all Tasks : ", err.message);
      return [];
    }
  }
}

export default ContractInteractions;
