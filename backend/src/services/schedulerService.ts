import cron, { ScheduledTask } from 'node-cron';
import { EdgeCaseService } from './edgeCaseService';

export class SchedulerService {
  private static instance: SchedulerService;
  private jobs: ScheduledTask[] = [];

  private constructor() {}

  public static getInstance(): SchedulerService {
    if (!SchedulerService.instance) {
      SchedulerService.instance = new SchedulerService();
    }
    return SchedulerService.instance;
  }

  /**
   * Start all scheduled jobs
   */
  public startAll() {
    console.log('Starting scheduler service...');
    
    // Run edge case checks every hour
    const edgeCaseJob = cron.schedule('0 * * * *', async () => {
      console.log('Running scheduled edge case checks...');
      await EdgeCaseService.runAllChecks();
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    // File cleanup every 6 hours
    const cleanupJob = cron.schedule('0 */6 * * *', async () => {
      console.log('Running scheduled file cleanup...');
      await EdgeCaseService.cleanupOldFiles();
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    // Communication gap check every 12 hours
    const communicationJob = cron.schedule('0 */12 * * *', async () => {
      console.log('Running communication gap check...');
      await EdgeCaseService.detectCommunicationGaps();
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    this.jobs.push(edgeCaseJob, cleanupJob, communicationJob);
    
    console.log(`Scheduler started with ${this.jobs.length} jobs`);
  }

  /**
   * Stop all scheduled jobs
   */
  public stopAll() {
    console.log('Stopping scheduler service...');
    this.jobs.forEach(job => job.stop());
    this.jobs = [];
    console.log('Scheduler stopped');
  }

  /**
   * Run edge case checks manually (for testing)
   */
  public async runEdgeCaseChecks() {
    await EdgeCaseService.runAllChecks();
  }
}
