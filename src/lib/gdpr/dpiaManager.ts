import { prisma } from '@/lib/prisma';
import { auditLogger } from '@/lib/audit/auditLogger';
import { DataProcessingActivity, LegalBasis } from '@prisma/client';

export interface DPIAAssessment {
  id: string;
  score: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendations: string[];
  requiredActions: string[];
  complianceStatus: 'COMPLIANT' | 'NEEDS_REVIEW' | 'NON_COMPLIANT';
  lastAssessment: Date;
  nextReview: Date;
}

export interface DPIAReport {
  summary: Record<string, unknown>;
  assessments: DPIAAssessment[];
  overallRisk: string;
  recommendations: string[];
  complianceStatus: string;
}

export interface ProcessingActivity {
  name: string;
  description: string;
  purpose: string;
  legalBasis: LegalBasis;
  dataCategories: string[];
  dataSubjects: string[];
  recipients: string[];
  thirdCountries: string[];
  retentionPeriod: string;
  securityMeasures: string[];
  automatizedDecisionMaking: boolean;
  largescaleProcessing: boolean;
  sensitiveData: boolean;
  publiclyAccessible: boolean;
  newTechnology: boolean;
  systematicMonitoring: boolean;
}

export interface DPIACriteria {
  name: string;
  weight: number;
  threshold: number;
  description: string;
  evaluator: (activity: ProcessingActivity) => number;
}

export class DPIAManager {
  private static instance: DPIAManager;
  private dpiaThresholds = {
    LOW: 30,
    MEDIUM: 50,
    HIGH: 70,
    CRITICAL: 85
  };

  private constructor() {}

  public static getInstance(): DPIAManager {
    if (!DPIAManager.instance) {
      DPIAManager.instance = new DPIAManager();
    }
    return DPIAManager.instance;
  }

  /**
   * Perform automated DPIA assessment
   */
  async performDPIA(
    tenantId: string,
    activityId: string,
    userId: string
  ): Promise<DPIAAssessment> {
    console.log(`Performing DPIA for activity ${activityId} in tenant ${tenantId}`);

    // Get processing activity
    const activity = await prisma.dataProcessingActivity.findUnique({
      where: { id: activityId },
    });

    if (!activity || activity.tenantId !== tenantId) {
      throw new Error('Processing activity not found or access denied');
    }

    // Convert to ProcessingActivity interface
    const processingActivity: ProcessingActivity = {
      name: activity.name,
      description: activity.description,
      purpose: activity.purpose,
      legalBasis: activity.legalBasis,
      dataCategories: activity.dataCategories,
      dataSubjects: activity.dataSubjects,
      recipients: activity.recipients,
      thirdCountries: activity.thirdCountries,
      retentionPeriod: activity.retentionPeriod,
      securityMeasures: activity.securityMeasures,
      automatizedDecisionMaking: this.checkAutomatizedDecisionMaking(activity),
      largescaleProcessing: this.checkLargescaleProcessing(activity),
      sensitiveData: this.checkSensitiveData(activity),
      publiclyAccessible: this.checkPubliclyAccessible(activity),
      newTechnology: this.checkNewTechnology(activity),
      systematicMonitoring: this.checkSystematicMonitoring(activity),
    };

    // Perform assessment
    const assessment = await this.assessActivity(processingActivity);

    // Store assessment results
    const dpiaRecord = await this.storeDPIAResults(tenantId, activityId, assessment, userId);

    // Log DPIA execution
    await auditLogger.logDataProcessing(
      userId,
      `DPIA Assessment: ${activity.name}`,
      activity.dataCategories,
      activity.legalBasis,
      tenantId,
      `DPIA Score: ${assessment.score}, Risk Level: ${assessment.riskLevel}`
    );

    return {
      id: dpiaRecord.id,
      ...assessment,
    };
  }

  /**
   * Get DPIA criteria for evaluation
   */
  private getDPIACriteria(): DPIACriteria[] {
    return [
      // Article 35(3) GDPR criteria
      {
        name: 'Systematic and extensive evaluation',
        weight: 15,
        threshold: 7,
        description: 'Systematic and extensive evaluation of personal aspects relating to natural persons',
        evaluator: (activity) => {
          if (activity.automatizedDecisionMaking && activity.largescaleProcessing) return 10;
          if (activity.automatizedDecisionMaking || activity.largescaleProcessing) return 6;
          return 2;
        }
      },
      {
        name: 'Large scale processing of special categories',
        weight: 20,
        threshold: 8,
        description: 'Processing on a large scale of special categories of data or personal data relating to criminal convictions',
        evaluator: (activity) => {
          if (activity.sensitiveData && activity.largescaleProcessing) return 10;
          if (activity.sensitiveData) return 7;
          if (activity.largescaleProcessing) return 4;
          return 1;
        }
      },
      {
        name: 'Systematic monitoring of publicly accessible area',
        weight: 12,
        threshold: 6,
        description: 'Systematic monitoring of a publicly accessible area on a large scale',
        evaluator: (activity) => {
          if (activity.systematicMonitoring && activity.publiclyAccessible && activity.largescaleProcessing) return 10;
          if (activity.systematicMonitoring && activity.publiclyAccessible) return 7;
          if (activity.systematicMonitoring) return 4;
          return 1;
        }
      },
      // Additional risk factors
      {
        name: 'Data subject vulnerability',
        weight: 10,
        threshold: 5,
        description: 'Processing affects vulnerable data subjects (children, employees, etc.)',
        evaluator: (activity) => {
          const vulnerableSubjects = activity.dataSubjects.filter(subject => 
            ['children', 'employees', 'patients', 'disabled persons'].some(vuln => 
              subject.toLowerCase().includes(vuln)
            )
          );
          return Math.min(10, vulnerableSubjects.length * 3);
        }
      },
      {
        name: 'Cross-border transfers',
        weight: 8,
        threshold: 4,
        description: 'Transfer of personal data to third countries without adequacy decision',
        evaluator: (activity) => {
          const unsafeCountries = activity.thirdCountries.filter(country => 
            !this.isAdequateCountry(country)
          );
          return Math.min(10, unsafeCountries.length * 2);
        }
      },
      {
        name: 'New technology or innovative use',
        weight: 8,
        threshold: 4,
        description: 'Use of new technological or organisational solutions',
        evaluator: (activity) => {
          if (activity.newTechnology) return 8;
          return 1;
        }
      },
      {
        name: 'Data combination or matching',
        weight: 7,
        threshold: 4,
        description: 'Combining or matching data from multiple sources',
        evaluator: (activity) => {
          if (activity.recipients.length > 3) return 8;
          if (activity.recipients.length > 1) return 5;
          return 2;
        }
      },
      {
        name: 'Denial of service or contract',
        weight: 10,
        threshold: 5,
        description: 'Processing may result in denial of service or contract to data subjects',
        evaluator: (activity) => {
          if (activity.automatizedDecisionMaking && activity.purpose.toLowerCase().includes('decision')) return 9;
          if (activity.automatizedDecisionMaking) return 5;
          return 1;
        }
      },
      {
        name: 'Security measures adequacy',
        weight: 10,
        threshold: 5,
        description: 'Adequacy of technical and organizational security measures',
        evaluator: (activity) => {
          const securityScore = Math.min(10, activity.securityMeasures.length);
          return 10 - securityScore; // Inverse score - fewer measures = higher risk
        }
      }
    ];
  }

  /**
   * Assess processing activity against DPIA criteria
   */
  private async assessActivity(activity: ProcessingActivity): Promise<Omit<DPIAAssessment, 'id'>> {
    const criteria = this.getDPIACriteria();
    let totalScore = 0;
    let maxScore = 0;
    const recommendations: string[] = [];
    const requiredActions: string[] = [];

    // Evaluate each criterion
    for (const criterion of criteria) {
      const criterionScore = criterion.evaluator(activity);
      const weightedScore = (criterionScore / 10) * criterion.weight;
      
      totalScore += weightedScore;
      maxScore += criterion.weight;

      // Generate recommendations based on scores
      if (criterionScore >= criterion.threshold) {
        recommendations.push(`Address ${criterion.name}: ${criterion.description}`);
        
        if (criterionScore >= 8) {
          requiredActions.push(`HIGH PRIORITY: Implement additional safeguards for ${criterion.name}`);
        }
      }
    }

    // Calculate final score as percentage
    const finalScore = Math.round((totalScore / maxScore) * 100);
    const riskLevel = this.calculateRiskLevel(finalScore);
    const complianceStatus = this.determineComplianceStatus(finalScore, requiredActions.length);

    // Add general recommendations based on risk level
    this.addGeneralRecommendations(riskLevel, activity, recommendations, requiredActions);

    return {
      score: finalScore,
      riskLevel,
      recommendations,
      requiredActions,
      complianceStatus,
      lastAssessment: new Date(),
      nextReview: this.calculateNextReviewDate(riskLevel),
    };
  }

  /**
   * Calculate risk level based on score
   */
  private calculateRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (score >= this.dpiaThresholds.CRITICAL) return 'CRITICAL';
    if (score >= this.dpiaThresholds.HIGH) return 'HIGH';
    if (score >= this.dpiaThresholds.MEDIUM) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Determine compliance status
   */
  private determineComplianceStatus(
    score: number, 
    requiredActionsCount: number
  ): 'COMPLIANT' | 'NEEDS_REVIEW' | 'NON_COMPLIANT' {
    if (score >= this.dpiaThresholds.HIGH && requiredActionsCount > 3) {
      return 'NON_COMPLIANT';
    }
    if (score >= this.dpiaThresholds.MEDIUM || requiredActionsCount > 0) {
      return 'NEEDS_REVIEW';
    }
    return 'COMPLIANT';
  }

  /**
   * Add general recommendations based on risk level and activity type
   */
  private addGeneralRecommendations(
    riskLevel: string,
    activity: ProcessingActivity,
    recommendations: string[],
    requiredActions: string[]
  ): void {
    switch (riskLevel) {
      case 'CRITICAL':
        requiredActions.push('MANDATORY: Consult with Data Protection Authority before processing');
        requiredActions.push('MANDATORY: Implement Privacy by Design principles');
        requiredActions.push('MANDATORY: Conduct regular compliance audits');
        break;
      
      case 'HIGH':
        recommendations.push('Consider consulting with Data Protection Officer');
        recommendations.push('Implement enhanced monitoring and logging');
        recommendations.push('Conduct annual compliance review');
        break;
      
      case 'MEDIUM':
        recommendations.push('Review and update security measures');
        recommendations.push('Ensure staff training on data protection');
        break;
      
      case 'LOW':
        recommendations.push('Maintain current security measures');
        recommendations.push('Monitor for changes in processing scope');
        break;
    }

    // Legal basis specific recommendations
    if (activity.legalBasis === LegalBasis.CONSENT) {
      recommendations.push('Ensure consent is freely given, specific, informed and unambiguous');
      recommendations.push('Implement easy consent withdrawal mechanism');
    }
    
    if (activity.legalBasis === LegalBasis.LEGITIMATE_INTERESTS) {
      recommendations.push('Conduct balancing test to ensure legitimate interests override data subject rights');
      recommendations.push('Provide clear information about legitimate interests in privacy notice');
    }
  }

  /**
   * Calculate next review date based on risk level
   */
  private calculateNextReviewDate(riskLevel: string): Date {
    const now = new Date();
    const reviewPeriods = {
      CRITICAL: 3, // 3 months
      HIGH: 6,     // 6 months
      MEDIUM: 12,  // 1 year
      LOW: 24      // 2 years
    };
    
    const monthsToAdd = reviewPeriods[riskLevel as keyof typeof reviewPeriods] || 12;
    now.setMonth(now.getMonth() + monthsToAdd);
    return now;
  }

  /**
   * Store DPIA results in database
   */
  private async storeDPIAResults(
    tenantId: string,
    activityId: string,
    assessment: Omit<DPIAAssessment, 'id'>,
    userId: string
  ): Promise<{ id: string }> {
    // In a real implementation, you'd have a DPIA results table
    // For now, we'll simulate storing in a generic document store
    const dpiaRecord = {
      id: `dpia_${activityId}_${Date.now()}`,
      tenantId,
      activityId,
      assessment,
      conductedBy: userId,
      conductedAt: new Date(),
    };

    console.log('DPIA results stored:', dpiaRecord);
    
    return { id: dpiaRecord.id };
  }

  /**
   * Get all DPIAs for a tenant
   */
  async getTenantDPIAs(tenantId: string): Promise<DPIAAssessment[]> {
    // Get all processing activities for tenant
    const activities = await prisma.dataProcessingActivity.findMany({
      where: { tenantId, isActive: true },
    });

    // For each activity, get latest DPIA (simulated)
    const dpias: DPIAAssessment[] = [];
    
    for (const activity of activities) {
      // In real implementation, fetch from DPIA results table
      // For now, generate assessment
      const processingActivity: ProcessingActivity = {
        name: activity.name,
        description: activity.description,
        purpose: activity.purpose,
        legalBasis: activity.legalBasis,
        dataCategories: activity.dataCategories,
        dataSubjects: activity.dataSubjects,
        recipients: activity.recipients,
        thirdCountries: activity.thirdCountries,
        retentionPeriod: activity.retentionPeriod,
        securityMeasures: activity.securityMeasures,
        automatizedDecisionMaking: this.checkAutomatizedDecisionMaking(activity),
        largescaleProcessing: this.checkLargescaleProcessing(activity),
        sensitiveData: this.checkSensitiveData(activity),
        publiclyAccessible: this.checkPubliclyAccessible(activity),
        newTechnology: this.checkNewTechnology(activity),
        systematicMonitoring: this.checkSystematicMonitoring(activity),
      };

      const assessment = await this.assessActivity(processingActivity);
      dpias.push({
        id: `dpia_${activity.id}`,
        ...assessment,
      });
    }

    return dpias;
  }

  /**
   * Generate DPIA report
   */
  async generateDPIAReport(tenantId: string): Promise<DPIAReport> {
    const assessments = await this.getTenantDPIAs(tenantId);
    
    const summary = {
      totalAssessments: assessments.length,
      riskDistribution: {
        CRITICAL: assessments.filter(a => a.riskLevel === 'CRITICAL').length,
        HIGH: assessments.filter(a => a.riskLevel === 'HIGH').length,
        MEDIUM: assessments.filter(a => a.riskLevel === 'MEDIUM').length,
        LOW: assessments.filter(a => a.riskLevel === 'LOW').length,
      },
      complianceDistribution: {
        COMPLIANT: assessments.filter(a => a.complianceStatus === 'COMPLIANT').length,
        NEEDS_REVIEW: assessments.filter(a => a.complianceStatus === 'NEEDS_REVIEW').length,
        NON_COMPLIANT: assessments.filter(a => a.complianceStatus === 'NON_COMPLIANT').length,
      },
      averageScore: assessments.reduce((sum, a) => sum + a.score, 0) / assessments.length || 0,
    };

    // Determine overall risk
    const overallRisk = this.calculateOverallRisk(assessments);
    
    // Aggregate recommendations
    const allRecommendations = assessments.flatMap(a => a.recommendations);
    const uniqueRecommendations = [...new Set(allRecommendations)];

    // Determine overall compliance status
    const complianceStatus = this.calculateOverallCompliance(assessments);

    return {
      summary,
      assessments,
      overallRisk,
      recommendations: uniqueRecommendations,
      complianceStatus,
    };
  }

  /**
   * Helper methods for activity checks
   */
  private checkAutomatizedDecisionMaking(activity: DataProcessingActivity): boolean {
    return activity.description?.toLowerCase().includes('automated') ||
           activity.description?.toLowerCase().includes('algorithm') ||
           activity.purpose?.toLowerCase().includes('decision');
  }

  private checkLargescaleProcessing(activity: DataProcessingActivity): boolean {
    return activity.dataSubjects?.some((subject: string) => 
      subject.toLowerCase().includes('large') || 
      subject.toLowerCase().includes('massive') ||
      subject.toLowerCase().includes('extensive')
    ) || false;
  }

  private checkSensitiveData(activity: DataProcessingActivity): boolean {
    const sensitiveCategories = [
      'health', 'medical', 'biometric', 'genetic', 'racial', 'ethnic',
      'political', 'religious', 'sexual', 'criminal', 'financial'
    ];
    
    return activity.dataCategories?.some((category: string) =>
      sensitiveCategories.some(sensitive => 
        category.toLowerCase().includes(sensitive)
      )
    ) || false;
  }

  private checkPubliclyAccessible(activity: DataProcessingActivity): boolean {
    return activity.description?.toLowerCase().includes('public') ||
           activity.description?.toLowerCase().includes('website') ||
           activity.description?.toLowerCase().includes('online');
  }

  private checkNewTechnology(activity: DataProcessingActivity): boolean {
    const newTechKeywords = ['ai', 'blockchain', 'iot', 'machine learning', 'facial recognition'];
    return newTechKeywords.some(tech => 
      activity.description?.toLowerCase().includes(tech) ||
      activity.securityMeasures?.some((measure: string) => 
        measure.toLowerCase().includes(tech)
      )
    );
  }

  private checkSystematicMonitoring(activity: DataProcessingActivity): boolean {
    return activity.description?.toLowerCase().includes('monitoring') ||
           activity.description?.toLowerCase().includes('tracking') ||
           activity.description?.toLowerCase().includes('surveillance');
  }

  private isAdequateCountry(country: string): boolean {
    // EU adequacy decisions as of 2024
    const adequateCountries = [
      'andorra', 'argentina', 'canada', 'faroe islands', 'guernsey', 'israel',
      'isle of man', 'japan', 'jersey', 'new zealand', 'switzerland', 'uruguay',
      'united kingdom', 'south korea'
    ];
    
    return adequateCountries.includes(country.toLowerCase());
  }

  private calculateOverallRisk(assessments: DPIAAssessment[]): string {
    if (assessments.some(a => a.riskLevel === 'CRITICAL')) return 'CRITICAL';
    if (assessments.some(a => a.riskLevel === 'HIGH')) return 'HIGH';
    if (assessments.some(a => a.riskLevel === 'MEDIUM')) return 'MEDIUM';
    return 'LOW';
  }

  private calculateOverallCompliance(assessments: DPIAAssessment[]): string {
    if (assessments.some(a => a.complianceStatus === 'NON_COMPLIANT')) return 'NON_COMPLIANT';
    if (assessments.some(a => a.complianceStatus === 'NEEDS_REVIEW')) return 'NEEDS_REVIEW';
    return 'COMPLIANT';
  }
}

// Export singleton instance
export const dpiaManager = DPIAManager.getInstance(); 