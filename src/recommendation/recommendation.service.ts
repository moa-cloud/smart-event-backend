import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { spawn } from 'child_process';
import * as path from 'path';
import { event as Event } from '../schemas/event.schema';
import { Interaction } from '../schemas/interaction.schema';
import { User } from '../schemas/user.schema';
import { existsSync } from 'fs';

@Injectable()
export class RecommendationService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<Event>,
    @InjectModel(Interaction.name) private interactionModel: Model<Interaction>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async getRecommendations(
    userId: string,
  ): Promise<{ eventId: string; score: number }[]> {
    try {
      // 1. Fetch data specific to the requested user
      const userObjectId = new Types.ObjectId(userId);
      const [userInteractions, allEvents, userData] = await Promise.all([
        this.interactionModel.find({ userId: userObjectId }).lean(), // Only get interactions for this user
        this.eventModel.find().lean(), // Get all events for recommendations
        this.userModel.findById(userId).lean(), // Get this user's data
      ]);

      if (!userData) {
        throw new Error(`User ${userId} not found`);
      }

      console.log('222222222222');
      // 2. Transform data with the requested userId
      const input = {
        userId: userId.toString(),
        interactions: userInteractions.map((i) => ({
          user_id: i.userId.toString(),
          event_id: i.eventId.toString(),
          interaction_type: i.interactionType,
          weight: i.weight || 1,
          created_at: i.created_at
            ? new Date(i.created_at).toISOString()
            : new Date().toISOString(), // or handle it gracefully
        })),
        events: allEvents.map((e) => ({
          event_id: e._id.toString(),
          title: e.title,
          description: e.description,
          location: e.location,
          category: e.eventCatagory.toString(),
          tags: e.tag || [],
        })),
        users: [
          {
            user_id: userId.toString(),
            age: 25,
            location: 'unknown',
          },
        ],
      };

      console.log('hhhhhhhhhhhhhhhhhh');
      console.log('input', input);
      // 3. Execute Python script with personalized data
      return await this.executePythonScript(input);
    } catch (err) {
      console.error('❌ RecommendationService error:', err);
      throw new Error(`Failed to get recommendations for user ${userId}`);
    }
  }

  private async executePythonScript(
    input: any,
  ): Promise<{ eventId: string; score: number }[]> {
    return new Promise((resolve, reject) => {
      // 1. Configure paths
      const pythonPath =
        process.platform === 'win32'
          ? 'C:\\Users\\HP\\miniconda3\\envs\\final-project\\python.exe'
          : 'python3';

      const scriptPath = path.join(process.cwd(), 'python', 'main.py');

      // 2. Validate paths
      if (!existsSync(scriptPath)) {
        return reject(`Python script not found at: ${scriptPath}`);
      }

      // 3. Prepare input
      let inputString: string;
      try {
        inputString = JSON.stringify(input);
        JSON.parse(inputString); // Verify JSON is valid
      } catch (e) {
        return reject(
          `Invalid input JSON: ${e instanceof Error ? e.message : String(e)}`,
        );
      }

      console.log('🚀 Launching Python with:');
      console.log(`  Python: ${pythonPath}`);
      console.log(`  Script: ${scriptPath}`);
      console.log(`  Input length: ${inputString.length} chars`);

      // 4. Create a temporary file for the input
      const tempInputPath = path.join(
        process.cwd(),
        'python',
        'temp_input.json',
      );
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('fs').writeFileSync(tempInputPath, inputString);
      } catch (e) {
        return reject(
          `Failed to create input file: ${e instanceof Error ? e.message : String(e)}`,
        );
      }

      // 5. Execute Python
      const pythonProcess = spawn(pythonPath, [scriptPath, tempInputPath], {
        windowsVerbatimArguments: false,
        shell: false,
        cwd: process.cwd(),
      });

      // 6. Set timeout
      const timeout = setTimeout(() => {
        pythonProcess.kill();
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          require('fs').unlinkSync(tempInputPath);
        } catch {}
        reject('Python script timed out after 30 seconds');
      }, 30000);

      let output = '';
      let errorOutput = '';

      // 7. Handle output streams
      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.error('[Python Error]', data.toString().trim());
      });

      // 8. Process completion
      pythonProcess.on('close', (code) => {
        clearTimeout(timeout);

        // Clean up temp file
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          require('fs').unlinkSync(tempInputPath);
        } catch {}

        if (code !== 0) {
          console.error('Python error output:', errorOutput);
          return reject(
            `Python script failed with code ${code}: ${errorOutput || 'No error output'}`,
          );
        }

        // Log raw output for debugging
        console.log('Raw Python stdout:', output);

        try {
          const result = JSON.parse(output);
          if (
            !result.recommendations ||
            !Array.isArray(result.recommendations)
          ) {
            return reject(
              'Python script returned invalid recommendations format',
            );
          }
          // Validate and transform recommendations
          const recommendations = result.recommendations.map((rec: any) => {
            if (!rec.eventId || typeof rec.score !== 'number') {
              throw new Error('Invalid recommendation format');
            }
            return { eventId: rec.eventId, score: rec.score };
          });
          resolve(recommendations);
        } catch (e) {
          console.error(
            'JSON parse error:',
            e instanceof Error ? e.message : String(e),
          );
          reject(
            `Output parsing failed: ${e instanceof Error ? e.message : 'Invalid JSON'}`,
          );
        }
      });

      pythonProcess.on('error', (error) => {
        clearTimeout(timeout);
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          require('fs').unlinkSync(tempInputPath);
        } catch {}
        reject(`Process failed to start: ${error.message}`);
      });
    });
  }
}
