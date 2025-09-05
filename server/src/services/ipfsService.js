const { Web3Storage } = require('web3.storage');
// const { create } = require('ipfs-http-client'); // Temporarily commented out due to compatibility issue
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const logger = require('../utils/logger');
const redisClient = require('../config/redis');

class IPFSService {
  constructor() {
    this.web3StorageClient = null;
    this.ipfsClient = null;
    this.pinataConfig = {
      apiKey: config.ipfs.pinata.apiKey,
      secretKey: config.ipfs.pinata.secretKey,
      endpoint: config.ipfs.pinata.endpoint
    };
    
    this.initialize();
  }

  async initialize() {
    try {
      // Initialize Web3.Storage client
      if (config.ipfs.web3Storage.token) {
        this.web3StorageClient = new Web3Storage({ 
          token: config.ipfs.web3Storage.token 
        });
        logger.info('Web3.Storage client initialized');
      } else {
        logger.warn('Web3.Storage token not configured');
      }

      // Initialize local IPFS client (if available) - Temporarily disabled
      try {
        // this.ipfsClient = create({ 
        //   url: 'http://localhost:5001/api/v0',
        //   timeout: config.ipfs.timeout
        // });
        
        // Test connection
        // await this.ipfsClient.id();
        // logger.info('Local IPFS client connected');
        this.ipfsClient = null; // Disabled for now
        logger.info('Local IPFS client disabled - using Web3.Storage and Pinata only');
      } catch (error) {
        logger.warn('Local IPFS client not available:', error.message);
        this.ipfsClient = null;
      }

    } catch (error) {
      logger.error('Failed to initialize IPFS service:', error);
    }
  }

  /**
   * Upload file to IPFS using multiple providers for redundancy
   */
  async uploadFile(filePath, metadata = {}) {
    try {
      const results = [];
      const fileName = path.basename(filePath);
      const fileStats = fs.statSync(filePath);
      
      // Validate file size
      if (fileStats.size > config.ipfs.maxFileSize) {
        throw new Error(`File size (${fileStats.size}) exceeds maximum allowed size (${config.ipfs.maxFileSize})`);
      }

      logger.info(`Uploading file to IPFS: ${fileName} (${fileStats.size} bytes)`);

      // Try Web3.Storage first
      if (this.web3StorageClient) {
        try {
          const fileBuffer = fs.readFileSync(filePath);
          const file = new File([fileBuffer], fileName, {
            type: metadata.mimeType || 'application/octet-stream'
          });
          
          const cid = await this.web3StorageClient.put([file], {
            name: fileName,
            maxRetries: 3
          });
          
          results.push({
            provider: 'web3.storage',
            cid: cid,
            url: `${config.ipfs.gateway}${cid}/${fileName}`,
            success: true
          });
          
          logger.info(`File uploaded to Web3.Storage: ${cid}`);
        } catch (error) {
          logger.error('Web3.Storage upload failed:', error);
          results.push({
            provider: 'web3.storage',
            success: false,
            error: error.message
          });
        }
      }

      // Try Pinata
      if (this.pinataConfig.apiKey && this.pinataConfig.secretKey) {
        try {
          const pinataResult = await this.uploadToPinata(filePath, metadata);
          results.push({
            provider: 'pinata',
            cid: pinataResult.IpfsHash,
            url: `${config.ipfs.gateway}${pinataResult.IpfsHash}`,
            success: true,
            pinataData: pinataResult
          });
          
          logger.info(`File uploaded to Pinata: ${pinataResult.IpfsHash}`);
        } catch (error) {
          logger.error('Pinata upload failed:', error);
          results.push({
            provider: 'pinata',
            success: false,
            error: error.message
          });
        }
      }

      // Try local IPFS client
      if (this.ipfsClient) {
        try {
          const fileBuffer = fs.readFileSync(filePath);
          const ipfsResult = await this.ipfsClient.add(fileBuffer, {
            pin: true,
            timeout: config.ipfs.timeout
          });
          
          results.push({
            provider: 'local-ipfs',
            cid: ipfsResult.cid.toString(),
            url: `${config.ipfs.gateway}${ipfsResult.cid.toString()}`,
            success: true
          });
          
          logger.info(`File uploaded to local IPFS: ${ipfsResult.cid.toString()}`);
        } catch (error) {
          logger.error('Local IPFS upload failed:', error);
          results.push({
            provider: 'local-ipfs',
            success: false,
            error: error.message
          });
        }
      }

      // Check if at least one upload succeeded
      const successfulUploads = results.filter(r => r.success);
      if (successfulUploads.length === 0) {
        throw new Error('All IPFS upload attempts failed');
      }

      // Return the first successful upload's CID
      const primaryResult = successfulUploads[0];
      
      // Cache the result
      await this.cacheFileMetadata(primaryResult.cid, {
        fileName,
        fileSize: fileStats.size,
        mimeType: metadata.mimeType,
        uploadedAt: new Date(),
        providers: results.filter(r => r.success).map(r => r.provider),
        ...metadata
      });

      return {
        cid: primaryResult.cid,
        url: primaryResult.url,
        fileName,
        fileSize: fileStats.size,
        providers: successfulUploads.map(r => r.provider),
        results
      };

    } catch (error) {
      logger.error('File upload to IPFS failed:', error);
      throw error;
    }
  }

  /**
   * Upload data directly to IPFS (for JSON objects, text, etc.)
   */
  async uploadData(data, options = {}) {
    try {
      const jsonData = typeof data === 'string' ? data : JSON.stringify(data);
      const dataBuffer = Buffer.from(jsonData, 'utf8');
      
      logger.info('Uploading data to IPFS');

      // Try Web3.Storage first
      if (this.web3StorageClient) {
        try {
          const file = new File([dataBuffer], options.fileName || 'data.json', {
            type: 'application/json'
          });
          
          const cid = await this.web3StorageClient.put([file], {
            name: options.fileName || 'data.json',
            maxRetries: 3
          });
          
          logger.info(`Data uploaded to Web3.Storage: ${cid}`);
          
          return {
            cid: cid,
            url: `${config.ipfs.gateway}${cid}`,
            provider: 'web3.storage',
            dataSize: dataBuffer.length
          };
          
        } catch (error) {
          logger.error('Web3.Storage data upload failed:', error);
        }
      }

      // Fallback to local IPFS
      if (this.ipfsClient) {
        try {
          const ipfsResult = await this.ipfsClient.add(dataBuffer, {
            pin: true,
            timeout: config.ipfs.timeout
          });
          
          logger.info(`Data uploaded to local IPFS: ${ipfsResult.cid.toString()}`);
          
          return {
            cid: ipfsResult.cid.toString(),
            url: `${config.ipfs.gateway}${ipfsResult.cid.toString()}`,
            provider: 'local-ipfs',
            dataSize: dataBuffer.length
          };
          
        } catch (error) {
          logger.error('Local IPFS data upload failed:', error);
        }
      }

      throw new Error('All IPFS data upload attempts failed');

    } catch (error) {
      logger.error('Data upload to IPFS failed:', error);
      throw error;
    }
  }

  /**
   * Upload file to Pinata
   */
  async uploadToPinata(filePath, metadata = {}) {
    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath));
      
      // Add metadata
      const pinataMetadata = {
        name: metadata.name || path.basename(filePath),
        keyvalues: {
          uploadedBy: 'freelance-escrow-backend',
          uploadedAt: new Date().toISOString(),
          ...metadata.keyvalues
        }
      };
      
      formData.append('pinataMetadata', JSON.stringify(pinataMetadata));
      
      // Add pinning options
      const pinataOptions = {
        cidVersion: 1,
        ...metadata.pinataOptions
      };
      
      formData.append('pinataOptions', JSON.stringify(pinataOptions));
      
      const response = await axios.post(
        `${this.pinataConfig.endpoint}/pinning/pinFileToIPFS`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'pinata_api_key': this.pinataConfig.apiKey,
            'pinata_secret_api_key': this.pinataConfig.secretKey
          },
          timeout: config.ipfs.timeout
        }
      );
      
      return response.data;
      
    } catch (error) {
      if (error.response) {
        throw new Error(`Pinata upload failed: ${error.response.data.error || error.response.statusText}`);
      }
      throw error;
    }
  }

  /**
   * Retrieve file content from IPFS
   */
  async getFile(cid, options = {}) {
    try {
      // Check cache first
      const cachedMetadata = await this.getCachedFileMetadata(cid);
      
      // Try multiple gateways for redundancy
      const gateways = [
        config.ipfs.gateway,
        'https://ipfs.io/ipfs/',
        'https://gateway.pinata.cloud/ipfs/',
        'https://cloudflare-ipfs.com/ipfs/'
      ];
      
      for (const gateway of gateways) {
        try {
          const url = `${gateway}${cid}`;
          logger.debug(`Attempting to fetch from gateway: ${url}`);
          
          const response = await axios.get(url, {
            timeout: config.ipfs.timeout,
            responseType: options.responseType || 'arraybuffer',
            headers: {
              'Accept': options.accept || '*/*'
            }
          });
          
          logger.info(`Successfully retrieved file from IPFS: ${cid}`);
          
          return {
            cid,
            data: response.data,
            metadata: cachedMetadata,
            gateway: gateway,
            contentType: response.headers['content-type']
          };
          
        } catch (error) {
          logger.debug(`Gateway ${gateway} failed:`, error.message);
          continue;
        }
      }
      
      throw new Error('Failed to retrieve file from all IPFS gateways');
      
    } catch (error) {
      logger.error(`Failed to get file from IPFS (${cid}):`, error);
      throw error;
    }
  }

  /**
   * Retrieve JSON data from IPFS
   */
  async getData(cid) {
    try {
      const result = await this.getFile(cid, { 
        responseType: 'text',
        accept: 'application/json'
      });
      
      const data = JSON.parse(result.data);
      
      return {
        cid,
        data,
        metadata: result.metadata
      };
      
    } catch (error) {
      logger.error(`Failed to get JSON data from IPFS (${cid}):`, error);
      throw error;
    }
  }

  /**
   * Pin existing content to ensure persistence
   */
  async pinContent(cid, metadata = {}) {
    try {
      const results = [];
      
      // Pin on Pinata
      if (this.pinataConfig.apiKey) {
        try {
          const pinataResult = await this.pinToPinata(cid, metadata);
          results.push({
            provider: 'pinata',
            success: true,
            result: pinataResult
          });
        } catch (error) {
          results.push({
            provider: 'pinata',
            success: false,
            error: error.message
          });
        }
      }
      
      // Pin on local IPFS
      if (this.ipfsClient) {
        try {
          await this.ipfsClient.pin.add(cid);
          results.push({
            provider: 'local-ipfs',
            success: true
          });
        } catch (error) {
          results.push({
            provider: 'local-ipfs',
            success: false,
            error: error.message
          });
        }
      }
      
      return results;
      
    } catch (error) {
      logger.error(`Failed to pin content (${cid}):`, error);
      throw error;
    }
  }

  /**
   * Pin content to Pinata by CID
   */
  async pinToPinata(cid, metadata = {}) {
    try {
      const pinataMetadata = {
        name: metadata.name || `pinned-${cid}`,
        keyvalues: {
          pinnedBy: 'freelance-escrow-backend',
          pinnedAt: new Date().toISOString(),
          ...metadata.keyvalues
        }
      };
      
      const response = await axios.post(
        `${this.pinataConfig.endpoint}/pinning/pinByHash`,
        {
          hashToPin: cid,
          pinataMetadata
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'pinata_api_key': this.pinataConfig.apiKey,
            'pinata_secret_api_key': this.pinataConfig.secretKey
          },
          timeout: config.ipfs.timeout
        }
      );
      
      return response.data;
      
    } catch (error) {
      if (error.response) {
        throw new Error(`Pinata pin failed: ${error.response.data.error || error.response.statusText}`);
      }
      throw error;
    }
  }

  /**
   * Cache file metadata in Redis
   */
  async cacheFileMetadata(cid, metadata) {
    try {
      const cacheKey = `ipfs:${cid}`;
      await redisClient.set(cacheKey, metadata, { ttl: 86400 }); // 24 hours
    } catch (error) {
      logger.error('Failed to cache file metadata:', error);
    }
  }

  /**
   * Get cached file metadata
   */
  async getCachedFileMetadata(cid) {
    try {
      const cacheKey = `ipfs:${cid}`;
      return await redisClient.get(cacheKey);
    } catch (error) {
      logger.debug('No cached metadata found for CID:', cid);
      return null;
    }
  }

  /**
   * Validate IPFS CID format
   */
  isValidCID(cid) {
    // Basic CID validation (v0 and v1)
    const cidV0Pattern = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
    const cidV1Pattern = /^b[a-z2-7]{58}$/;
    
    return cidV0Pattern.test(cid) || cidV1Pattern.test(cid);
  }

  /**
   * Generate IPFS URL from CID
   */
  getIPFSUrl(cid, gateway = null) {
    if (!this.isValidCID(cid)) {
      throw new Error('Invalid IPFS CID');
    }
    
    const selectedGateway = gateway || config.ipfs.gateway;
    return `${selectedGateway}${cid}`;
  }

  /**
   * Get service status and statistics
   */
  async getStatus() {
    try {
      const status = {
        web3Storage: {
          available: !!this.web3StorageClient,
          configured: !!config.ipfs.web3Storage.token
        },
        pinata: {
          available: !!(this.pinataConfig.apiKey && this.pinataConfig.secretKey),
          configured: !!(this.pinataConfig.apiKey && this.pinataConfig.secretKey)
        },
        localIPFS: {
          available: !!this.ipfsClient,
          configured: true
        }
      };
      
      // Test Pinata connection if configured
      if (status.pinata.configured) {
        try {
          await axios.get(`${this.pinataConfig.endpoint}/data/testAuthentication`, {
            headers: {
              'pinata_api_key': this.pinataConfig.apiKey,
              'pinata_secret_api_key': this.pinataConfig.secretKey
            },
            timeout: 5000
          });
          status.pinata.connected = true;
        } catch (error) {
          status.pinata.connected = false;
          status.pinata.error = error.message;
        }
      }
      
      // Test local IPFS connection
      if (status.localIPFS.available) {
        try {
          await this.ipfsClient.id();
          status.localIPFS.connected = true;
        } catch (error) {
          status.localIPFS.connected = false;
          status.localIPFS.error = error.message;
        }
      }
      
      return status;
      
    } catch (error) {
      logger.error('Failed to get IPFS service status:', error);
      return {
        error: error.message
      };
    }
  }
}

module.exports = IPFSService;
