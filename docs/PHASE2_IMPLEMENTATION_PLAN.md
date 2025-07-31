# Phase 2: Calendar Rules Engine and Validations - Implementation Plan

**Version:** 1.0  
**Date:** January 2025  
**Status:** Ready for Development  
**Phase:** 2 of 4  
**Duration:** 4 weeks (Weeks 5-8)

## Executive Summary

Phase 2 focuses on implementing the intelligent scheduling engine that will transform the application from a basic task manager into a smart productivity tool. The core deliverable is a rule-based scheduling system that validates task placements, provides intelligent suggestions, and ensures optimal productivity through environment-aware scheduling.

**Key Deliverables:**

- Advanced scheduling rules engine with real-time validation
- Intelligent suggestion system for optimal task placement
- Rule builder interface for user-defined scheduling constraints
- Enhanced frontend validation feedback with drag-and-drop integration
- Comprehensive testing suite for scheduling logic

## Current State Analysis

### ✅ Completed in Phase 1:

- Basic task CRUD operations with full API coverage
- Calendar day configuration with environment and focus time settings
- Simple validation logic (environment mismatch, focus time, availability)
- Frontend calendar with drag-and-drop functionality
- Database schema for scheduling rules (already exists in models)
- User authentication and profile management
- Category management system

### 🔄 Phase 2 Focus:

- Advanced scheduling rules engine with priority-based evaluation
- Real-time validation API with detailed feedback
- Intelligent suggestion system with scoring algorithms
- Rule builder interface with visual condition editor
- Enhanced frontend validation feedback with real-time updates
- Comprehensive testing and performance optimization

## Implementation Timeline

### Week 5-6: Backend Scheduling Engine Core

#### 5.1 Scheduling Engine Service (`backend/app/services/scheduling_engine.py`)

**Priority: Critical**  
**Estimated Effort: 3 days**

```python
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from ..db.models import Task, UserCalendarDay, SchedulingRule, User
from ..schemas.scheduling import ValidationResult, SuggestionSlot, RuleEvaluationResult

class SchedulingEngine:
    def __init__(self, db: Session):
        self.db = db

    def validate_placement(
        self,
        task_id: str,
        start_time: datetime,
        end_time: datetime,
        user_id: str
    ) -> ValidationResult:
        """Validate if a task can be scheduled at the proposed time"""

    def suggest_slots(
        self,
        task_id: str,
        date_range: Tuple[datetime, datetime],
        user_id: str
    ) -> List[SuggestionSlot]:
        """Find optimal scheduling slots for a task"""

    def evaluate_rules(
        self,
        task: Task,
        calendar_day: UserCalendarDay,
        proposed_slot: Dict[str, Any]
    ) -> RuleEvaluationResult:
        """Evaluate all applicable scheduling rules"""

    def auto_schedule_tasks(
        self,
        task_ids: List[str],
        date_range: Tuple[datetime, datetime],
        user_id: str
    ) -> Dict[str, Any]:
        """Automatically schedule multiple tasks optimally"""
```

**Key Features:**

- Rule evaluation with priority ordering (lowest number = highest priority)
- Conflict detection (time overlaps, environment mismatches, focus requirements)
- Optimization scoring (priority + deadline + focus time alignment + environment fit)
- Constraint satisfaction (environment, focus requirements, availability)
- Suggestion ranking based on multiple factors

**Implementation Details:**

1. **Rule Evaluation Engine**: Parse and evaluate JSON conditions against task and calendar context
2. **Conflict Detection**: Check for time overlaps, environment mismatches, and constraint violations
3. **Scoring Algorithm**: Calculate slot suitability scores (0.0-1.0) based on multiple factors
4. **Suggestion Generation**: Find optimal slots within date range with fallback options

#### 5.2 Scheduling Schemas (`backend/app/schemas/scheduling.py`)

**Priority: Critical**  
**Estimated Effort: 1 day**

```python
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class ValidationResult(BaseModel):
    is_valid: bool
    validation_result: str = Field(..., description="allowed|blocked|warned")
    warnings: List[str] = []
    block_reasons: List[str] = []
    suggestions: List["SuggestionSlot"] = []
    rule_evaluations: List["RuleEvaluationResult"] = []

class SuggestionSlot(BaseModel):
    start_time: datetime
    end_time: datetime
    score: float = Field(..., ge=0.0, le=1.0)
    reason: str
    calendar_day_id: Optional[str] = None

class RuleEvaluationResult(BaseModel):
    rule_id: str
    rule_name: str
    action: str
    triggered: bool
    message: Optional[str] = None
    severity: str = Field(..., description="info|warning|error")

class SchedulingRuleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    conditions: List[Dict[str, Any]]
    action: str = Field(..., description="allow|block|warn|suggest_alternative")
    alert_message: Optional[str] = None
    priority_order: int = 100
    is_active: bool = True

class SchedulingRuleResponse(SchedulingRuleCreate):
    rule_id: str
    created_at: datetime
    updated_at: datetime
```

#### 5.3 Scheduling API Endpoints (`backend/app/api/v1/scheduling.py`)

**Priority: Critical**  
**Estimated Effort: 2 days**

```python
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from ...core.auth import get_current_user
from ...db.session import get_db
from ...db.models import User, SchedulingRule
from ...schemas.scheduling import *
from ...services.scheduling_engine import SchedulingEngine

router = APIRouter()

@router.post("/validate", response_model=ValidationResult)
async def validate_placement(
    task_id: str,
    proposed_start_time: datetime,
    proposed_end_time: datetime,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Validate if a task can be scheduled at the proposed time"""

@router.post("/suggest", response_model=List[SuggestionSlot])
async def suggest_slots(
    task_id: str,
    start_date: str = Query(..., description="YYYY-MM-DD"),
    end_date: str = Query(..., description="YYYY-MM-DD"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Find optimal scheduling slots for a task"""

@router.post("/auto-schedule")
async def auto_schedule_tasks(
    task_ids: List[str],
    start_date: str = Query(..., description="YYYY-MM-DD"),
    end_date: str = Query(..., description="YYYY-MM-DD"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Automatically schedule multiple tasks optimally"""

# Scheduling Rules CRUD
@router.get("/rules", response_model=List[SchedulingRuleResponse])
async def get_scheduling_rules(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all scheduling rules for the current user"""

@router.post("/rules", response_model=SchedulingRuleResponse)
async def create_scheduling_rule(
    rule: SchedulingRuleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new scheduling rule"""

@router.put("/rules/{rule_id}", response_model=SchedulingRuleResponse)
async def update_scheduling_rule(
    rule_id: str,
    rule: SchedulingRuleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an existing scheduling rule"""

@router.delete("/rules/{rule_id}")
async def delete_scheduling_rule(
    rule_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a scheduling rule"""
```

**API Response Examples:**

**Validation Request:**

```json
{
  "task_id": "uuid",
  "proposed_start_time": "2025-05-28T09:00:00Z",
  "proposed_end_time": "2025-05-28T10:30Z"
}
```

**Validation Response:**

```json
{
  "is_valid": true,
  "validation_result": "allowed",
  "warnings": ["Task requires focus but scheduled outside focus time"],
  "block_reasons": [],
  "suggestions": [
    {
      "start_time": "2025-05-28T09:00:00Z",
      "end_time": "2025-05-28T10:30Z",
      "score": 0.9,
      "reason": "Matches focus time and work environment"
    }
  ],
  "rule_evaluations": [
    {
      "rule_id": "uuid",
      "rule_name": "Block urgent tasks outside focus",
      "action": "warn",
      "triggered": true,
      "message": "Urgent tasks should be scheduled during focus time",
      "severity": "warning"
    }
  ]
}
```

### Week 7: Frontend Scheduling Integration

#### 7.1 Scheduling API Client (`frontend/src/api/scheduling.ts`)

**Priority: Critical**  
**Estimated Effort: 1 day**

```typescript
import { apiClient } from "./client";

export interface ValidationResult {
  is_valid: boolean;
  validation_result: "allowed" | "blocked" | "warned";
  warnings: string[];
  block_reasons: string[];
  suggestions: SuggestionSlot[];
  rule_evaluations: RuleEvaluationResult[];
}

export interface SuggestionSlot {
  start_time: string;
  end_time: string;
  score: number;
  reason: string;
  calendar_day_id?: string;
}

export interface SchedulingRule {
  rule_id: string;
  name: string;
  description?: string;
  conditions: any[];
  action: "allow" | "block" | "warn" | "suggest_alternative";
  alert_message?: string;
  priority_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const schedulingApi = {
  validatePlacement: async (
    taskId: string,
    startTime: string,
    endTime: string,
  ): Promise<ValidationResult> => {
    const response = await apiClient.post("/scheduling/validate", {
      task_id: taskId,
      proposed_start_time: startTime,
      proposed_end_time: endTime,
    });
    return response.data;
  },

  suggestSlots: async (
    taskId: string,
    startDate: string,
    endDate: string,
  ): Promise<SuggestionSlot[]> => {
    const response = await apiClient.post("/scheduling/suggest", null, {
      params: { task_id: taskId, start_date: startDate, end_date: endDate },
    });
    return response.data;
  },

  getRules: async (): Promise<SchedulingRule[]> => {
    const response = await apiClient.get("/scheduling/rules");
    return response.data;
  },

  createRule: async (
    rule: Omit<SchedulingRule, "rule_id" | "created_at" | "updated_at">,
  ): Promise<SchedulingRule> => {
    const response = await apiClient.post("/scheduling/rules", rule);
    return response.data;
  },

  updateRule: async (
    ruleId: string,
    rule: Partial<SchedulingRule>,
  ): Promise<SchedulingRule> => {
    const response = await apiClient.put(`/scheduling/rules/${ruleId}`, rule);
    return response.data;
  },

  deleteRule: async (ruleId: string): Promise<void> => {
    await apiClient.delete(`/scheduling/rules/${ruleId}`);
  },
};
```

#### 7.2 Enhanced Calendar Validation (`frontend/src/pages/calendar/Calendar.tsx`)

**Priority: Critical**  
**Estimated Effort: 2 days**

```typescript
// Add real-time validation to handleEventReceive
const handleEventReceive = async (info: EventReceiveInfo) => {
  const taskId =
    info.event.extendedProps.taskId || info.event.extendedProps.task_id;
  const start = info.event.start;
  const end = info.event.end;

  if (!taskId || !start || !end) {
    alert("Could not schedule task: missing data");
    return;
  }

  try {
    // Validate placement before scheduling
    const validation = await schedulingApi.validatePlacement(
      taskId,
      start.toISOString(),
      end.toISOString(),
    );

    if (!validation.is_valid) {
      // Show validation errors
      const errorMessage = validation.block_reasons.join("\n");
      alert(`Cannot schedule task:\n${errorMessage}`);

      // If there are suggestions, show them
      if (validation.suggestions.length > 0) {
        const suggestion = validation.suggestions[0];
        const useSuggestion = confirm(
          `Would you like to use the suggested time instead?\n${suggestion.reason}`,
        );
        if (useSuggestion) {
          await updateTask(taskId, {
            scheduled_slots: [
              {
                start_time: suggestion.start_time,
                end_time: suggestion.end_time,
                calendar_day_id: suggestion.calendar_day_id,
              },
            ],
          });
          fetchAndStoreCalendarData(dateRange);
          return;
        }
      }
      return;
    }

    // Show warnings if any
    if (validation.warnings.length > 0) {
      const warningMessage = validation.warnings.join("\n");
      const proceed = confirm(`Warning:\n${warningMessage}\n\nProceed anyway?`);
      if (!proceed) return;
    }

    // Schedule the task
    await updateTask(taskId, {
      scheduled_slots: [
        {
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          calendar_day_id: null,
        },
      ],
    });

    fetchAndStoreCalendarData(dateRange);
  } catch (error) {
    alert("Failed to schedule task.");
    console.error(error);
  }
};
```

**Key Enhancements:**

1. **Real-time Validation**: Validate task placement before scheduling
2. **Smart Suggestions**: Offer alternative times when validation fails
3. **Warning System**: Show warnings but allow user to proceed
4. **Error Handling**: Graceful handling of validation errors
5. **User Feedback**: Clear messages about why scheduling failed

### Week 8: Rule Builder Interface

#### 8.1 Rule Builder Component (`frontend/src/components/scheduling/RuleBuilder.tsx`)

**Priority: High**  
**Estimated Effort: 2 days**

```typescript
import React, { useState } from 'react'
import { SchedulingRule } from '../../api/scheduling'

interface RuleBuilderProps {
  onSave: (rule: Omit<SchedulingRule, 'rule_id' | 'created_at' | 'updated_at'>) => void
  onCancel: () => void
  initialRule?: Partial<SchedulingRule>
}

export const RuleBuilder: React.FC<RuleBuilderProps> = ({
  onSave,
  onCancel,
  initialRule
}) => {
  const [name, setName] = useState(initialRule?.name || '')
  const [description, setDescription] = useState(initialRule?.description || '')
  const [action, setAction] = useState(initialRule?.action || 'warn')
  const [conditions, setConditions] = useState(initialRule?.conditions || [])
  const [alertMessage, setAlertMessage] = useState(initialRule?.alert_message || '')
  const [priorityOrder, setPriorityOrder] = useState(initialRule?.priority_order || 100)

  const handleSave = () => {
    onSave({
      name,
      description,
      conditions,
      action,
      alert_message: alertMessage,
      priority_order: priorityOrder,
      is_active: true
    })
  }

  return (
    <div className="rule-builder">
      <h3>Create Scheduling Rule</h3>

      <div className="form-group">
        <label>Rule Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Block urgent tasks outside focus time"
        />
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description of what this rule does"
        />
      </div>

      <div className="form-group">
        <label>Action</label>
        <select value={action} onChange={(e) => setAction(e.target.value)}>
          <option value="allow">Allow</option>
          <option value="block">Block</option>
          <option value="warn">Warn</option>
          <option value="suggest_alternative">Suggest Alternative</option>
        </select>
      </div>

      <ConditionBuilder conditions={conditions} onChange={setConditions} />

      <div className="form-group">
        <label>Alert Message</label>
        <input
          type="text"
          value={alertMessage}
          onChange={(e) => setAlertMessage(e.target.value)}
          placeholder="Message to show when rule is triggered"
        />
      </div>

      <div className="form-group">
        <label>Priority Order</label>
        <input
          type="number"
          value={priorityOrder}
          onChange={(e) => setPriorityOrder(parseInt(e.target.value))}
          min="1"
          max="1000"
        />
      </div>

      <div className="actions">
        <button onClick={handleSave} disabled={!name.trim()}>
          Save Rule
        </button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}
```

#### 8.2 Condition Builder Component (`frontend/src/components/scheduling/ConditionBuilder.tsx`)

**Priority: High**  
**Estimated Effort: 2 days**

```typescript
import React from 'react'

interface Condition {
  source: 'task_property' | 'calendar_context' | 'time_context'
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in'
  value: any
}

interface ConditionBuilderProps {
  conditions: Condition[]
  onChange: (conditions: Condition[]) => void
}

export const ConditionBuilder: React.FC<ConditionBuilderProps> = ({
  conditions,
  onChange
}) => {
  const addCondition = () => {
    onChange([...conditions, {
      source: 'task_property',
      field: 'priority',
      operator: 'equals',
      value: 'high'
    }])
  }

  const updateCondition = (index: number, condition: Condition) => {
    const newConditions = [...conditions]
    newConditions[index] = condition
    onChange(newConditions)
  }

  const removeCondition = (index: number) => {
    onChange(conditions.filter((_, i) => i !== index))
  }

  return (
    <div className="condition-builder">
      <label>Conditions</label>

      {conditions.map((condition, index) => (
        <div key={index} className="condition-row">
          <select
            value={condition.source}
            onChange={(e) => updateCondition(index, { ...condition, source: e.target.value })}
          >
            <option value="task_property">Task Property</option>
            <option value="calendar_context">Calendar Context</option>
            <option value="time_context">Time Context</option>
          </select>

          <select
            value={condition.field}
            onChange={(e) => updateCondition(index, { ...condition, field: e.target.value })}
          >
            {condition.source === 'task_property' && (
              <>
                <option value="priority">Priority</option>
                <option value="category_id">Category</option>
                <option value="requires_focus">Requires Focus</option>
                <option value="estimated_duration_minutes">Duration</option>
              </>
            )}
            {condition.source === 'calendar_context' && (
              <>
                <option value="work_environment">Work Environment</option>
                <option value="has_focus_slots">Has Focus Slots</option>
              </>
            )}
            {condition.source === 'time_context' && (
              <>
                <option value="day_of_week">Day of Week</option>
                <option value="time_of_day">Time of Day</option>
                <option value="is_weekend">Is Weekend</option>
              </>
            )}
          </select>

          <select
            value={condition.operator}
            onChange={(e) => updateCondition(index, { ...condition, operator: e.target.value })}
          >
            <option value="equals">Equals</option>
            <option value="not_equals">Not Equals</option>
            <option value="contains">Contains</option>
            <option value="greater_than">Greater Than</option>
            <option value="less_than">Less Than</option>
            <option value="in">In</option>
            <option value="not_in">Not In</option>
          </select>

          <input
            type="text"
            value={condition.value}
            onChange={(e) => updateCondition(index, { ...condition, value: e.target.value })}
            placeholder="Value"
          />

          <button onClick={() => removeCondition(index)}>Remove</button>
        </div>
      ))}

      <button onClick={addCondition}>Add Condition</button>
    </div>
  )
}
```

#### 8.3 Rules Management Page (`frontend/src/pages/settings/SchedulingRulesPage.tsx`)

**Priority: Medium**  
**Estimated Effort: 1 day**

```typescript
import React, { useState, useEffect } from 'react'
import { schedulingApi, SchedulingRule } from '../../api/scheduling'
import { RuleBuilder } from '../../components/scheduling/RuleBuilder'

export const SchedulingRulesPage: React.FC = () => {
  const [rules, setRules] = useState<SchedulingRule[]>([])
  const [loading, setLoading] = useState(true)
  const [showBuilder, setShowBuilder] = useState(false)
  const [editingRule, setEditingRule] = useState<SchedulingRule | null>(null)

  useEffect(() => {
    loadRules()
  }, [])

  const loadRules = async () => {
    try {
      const rulesData = await schedulingApi.getRules()
      setRules(rulesData)
    } catch (error) {
      console.error('Failed to load rules:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRule = async (ruleData: Omit<SchedulingRule, 'rule_id' | 'created_at' | 'updated_at'>) => {
    try {
      await schedulingApi.createRule(ruleData)
      setShowBuilder(false)
      loadRules()
    } catch (error) {
      console.error('Failed to create rule:', error)
    }
  }

  const handleUpdateRule = async (ruleId: string, ruleData: Partial<SchedulingRule>) => {
    try {
      await schedulingApi.updateRule(ruleId, ruleData)
      setEditingRule(null)
      loadRules()
    } catch (error) {
      console.error('Failed to update rule:', error)
    }
  }

  const handleDeleteRule = async (ruleId: string) => {
    if (confirm('Are you sure you want to delete this rule?')) {
      try {
        await schedulingApi.deleteRule(ruleId)
        loadRules()
      } catch (error) {
        console.error('Failed to delete rule:', error)
      }
    }
  }

  if (loading) return <div>Loading rules...</div>

  return (
    <div className="scheduling-rules-page">
      <div className="header">
        <h2>Scheduling Rules</h2>
        <button onClick={() => setShowBuilder(true)}>Create New Rule</button>
      </div>

      <div className="rules-list">
        {rules.map((rule) => (
          <div key={rule.rule_id} className="rule-card">
            <div className="rule-header">
              <h3>{rule.name}</h3>
              <div className="actions">
                <button onClick={() => setEditingRule(rule)}>Edit</button>
                <button onClick={() => handleDeleteRule(rule.rule_id)}>Delete</button>
              </div>
            </div>

            {rule.description && <p>{rule.description}</p>}

            <div className="rule-details">
              <span className="action">{rule.action}</span>
              <span className="priority">Priority: {rule.priority_order}</span>
              <span className="status">{rule.is_active ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
        ))}
      </div>

      {showBuilder && (
        <div className="modal">
          <RuleBuilder
            onSave={handleCreateRule}
            onCancel={() => setShowBuilder(false)}
          />
        </div>
      )}

      {editingRule && (
        <div className="modal">
          <RuleBuilder
            onSave={(ruleData) => handleUpdateRule(editingRule.rule_id, ruleData)}
            onCancel={() => setEditingRule(null)}
            initialRule={editingRule}
          />
        </div>
      )}
    </div>
  )
}
```

## Testing Strategy

### Backend Testing (`backend/tests/test_scheduling_engine.py`)

**Priority: High**  
**Estimated Effort: 2 days**

```python
import pytest
from datetime import datetime, timedelta
from app.services.scheduling_engine import SchedulingEngine
from app.db.models import Task, UserCalendarDay, SchedulingRule, User
from app.schemas.scheduling import ValidationResult

class TestSchedulingEngine:
    def test_validate_placement_with_focus_requirement(self, db_session, test_user):
        # Create calendar day with focus slots
        calendar_day = UserCalendarDay(
            user_id=test_user.user_id,
            date="2025-01-02",
            work_environment="home",
            focus_slots=[{"start_time": "09:00", "end_time": "11:00", "focus_level": "high"}],
            availability_slots=[{"start_time": "09:00", "end_time": "17:00", "status": "available"}]
        )
        db_session.add(calendar_day)

        # Create task requiring focus
        task = Task(
            user_id=test_user.user_id,
            title="Deep Work Task",
            requires_focus=True,
            estimated_duration_minutes=60
        )
        db_session.add(task)
        db_session.commit()

        # Test validation
        engine = SchedulingEngine(db_session)
        result = engine.validate_placement(
            str(task.task_id),
            datetime(2025, 1, 2, 9, 30),  # Within focus time
            datetime(2025, 1, 2, 10, 30),
            str(test_user.user_id)
        )

        assert result.is_valid == True

        # Test outside focus time
        result2 = engine.validate_placement(
            str(task.task_id),
            datetime(2025, 1, 2, 14, 0),  # Outside focus time
            datetime(2025, 1, 2, 15, 0),
            str(test_user.user_id)
        )

        assert result2.is_valid == False
        assert "Not within focus time" in result2.warnings

    def test_rule_evaluation(self, db_session, test_user):
        # Create a rule that blocks urgent tasks outside focus time
        rule = SchedulingRule(
            user_id=test_user.user_id,
            name="Block urgent tasks outside focus",
            conditions=[
                {
                    "source": "task_property",
                    "field": "priority",
                    "operator": "equals",
                    "value": "urgent"
                }
            ],
            action="block",
            alert_message="Urgent tasks must be scheduled during focus time"
        )
        db_session.add(rule)

        # Test rule evaluation
        engine = SchedulingEngine(db_session)
        # ... test implementation

    def test_suggestion_generation(self, db_session, test_user):
        # Test that suggestions are generated with proper scoring
        engine = SchedulingEngine(db_session)
        # ... test implementation

    def test_auto_scheduling(self, db_session, test_user):
        # Test automatic scheduling of multiple tasks
        engine = SchedulingEngine(db_session)
        # ... test implementation
```

### Frontend Testing (`frontend/src/components/scheduling/__tests__/RuleBuilder.test.tsx`)

**Priority: Medium**  
**Estimated Effort: 1 day**

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { RuleBuilder } from '../RuleBuilder'

describe('RuleBuilder', () => {
  const mockOnSave = jest.fn()
  const mockOnCancel = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders form fields correctly', () => {
    render(<RuleBuilder onSave={mockOnSave} onCancel={mockOnCancel} />)

    expect(screen.getByLabelText(/rule name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/action/i)).toBeInTheDocument()
    expect(screen.getByText(/conditions/i)).toBeInTheDocument()
  })

  it('calls onSave with correct data when form is submitted', () => {
    render(<RuleBuilder onSave={mockOnSave} onCancel={mockOnCancel} />)

    fireEvent.change(screen.getByLabelText(/rule name/i), {
      target: { value: 'Test Rule' }
    })

    fireEvent.click(screen.getByText(/save rule/i))

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test Rule',
        action: 'warn',
        conditions: [],
        is_active: true
      })
    )
  })

  it('validates required fields', () => {
    render(<RuleBuilder onSave={mockOnSave} onCancel={mockOnCancel} />)

    const saveButton = screen.getByText(/save rule/i)
    expect(saveButton).toBeDisabled()

    fireEvent.change(screen.getByLabelText(/rule name/i), {
      target: { value: 'Test Rule' }
    })

    expect(saveButton).not.toBeDisabled()
  })
})
```

### Integration Testing (`backend/tests/test_scheduling_integration.py`)

**Priority: High**  
**Estimated Effort: 1 day**

```python
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

class TestSchedulingIntegration:
    def test_validate_placement_endpoint(self, test_user_token):
        # Test the complete validation flow
        headers = {"Authorization": f"Bearer {test_user_token}"}

        response = client.post(
            "/api/v1/scheduling/validate",
            json={
                "task_id": "test-task-id",
                "proposed_start_time": "2025-01-02T09:00:00Z",
                "proposed_end_time": "2025-01-02T10:00:00Z"
            },
            headers=headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "is_valid" in data
        assert "validation_result" in data

    def test_suggest_slots_endpoint(self, test_user_token):
        # Test suggestion generation
        headers = {"Authorization": f"Bearer {test_user_token}"}

        response = client.post(
            "/api/v1/scheduling/suggest",
            params={
                "task_id": "test-task-id",
                "start_date": "2025-01-02",
                "end_date": "2025-01-08"
            },
            headers=headers
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_rules_crud_endpoints(self, test_user_token):
        # Test complete CRUD operations for rules
        headers = {"Authorization": f"Bearer {test_user_token}"}

        # Create rule
        rule_data = {
            "name": "Test Rule",
            "description": "Test description",
            "conditions": [
                {
                    "source": "task_property",
                    "field": "priority",
                    "operator": "equals",
                    "value": "high"
                }
            ],
            "action": "warn",
            "alert_message": "Test alert"
        }

        create_response = client.post(
            "/api/v1/scheduling/rules",
            json=rule_data,
            headers=headers
        )

        assert create_response.status_code == 201
        created_rule = create_response.json()
        rule_id = created_rule["rule_id"]

        # Get rules
        get_response = client.get("/api/v1/scheduling/rules", headers=headers)
        assert get_response.status_code == 200
        rules = get_response.json()
        assert len(rules) > 0

        # Update rule
        update_data = {"name": "Updated Test Rule"}
        update_response = client.put(
            f"/api/v1/scheduling/rules/{rule_id}",
            json=update_data,
            headers=headers
        )

        assert update_response.status_code == 200

        # Delete rule
        delete_response = client.delete(
            f"/api/v1/scheduling/rules/{rule_id}",
            headers=headers
        )

        assert delete_response.status_code == 204
```

## Success Criteria & KPIs

### Technical Success Criteria:

1. **API Performance**:
   - Validation requests complete in < 100ms (95th percentile)
   - Rule evaluation completes in < 50ms per rule
   - Suggestion generation completes in < 200ms

2. **Rule Evaluation**:
   - All rules are evaluated correctly with proper priority ordering
   - Rule conflicts are resolved according to priority_order
   - Complex conditions are parsed and evaluated accurately

3. **Suggestion Quality**:
   - 80% of suggestions are accepted by users
   - Suggestions have scores between 0.0 and 1.0
   - Top suggestions are always valid placements

4. **Error Handling**:
   - 0% of validation requests result in 500 errors
   - All validation errors return proper HTTP status codes
   - Detailed error messages are provided for debugging

### User Experience Success Criteria:

1. **Real-time Feedback**:
   - Users see validation results within 200ms of drag operations
   - Validation feedback is displayed immediately without page refresh
   - Suggestions appear instantly when validation fails

2. **Intuitive Rule Creation**:
   - Users can create their first rule within 2 minutes
   - Rule builder interface is self-explanatory
   - Condition builder provides helpful field options

3. **Helpful Suggestions**:
   - Users accept 60% of scheduling suggestions
   - Suggestions include clear reasoning for why they're optimal
   - Multiple suggestion options are provided when available

4. **Reduced Scheduling Errors**:
   - 90% reduction in invalid task placements
   - Users understand why scheduling failed
   - Clear guidance on how to fix scheduling issues

### Business Success Criteria:

1. **Feature Adoption**:
   - 60% of users create at least one scheduling rule within first month
   - 40% of users create 3+ rules within first month
   - 80% of users use validation features regularly

2. **Productivity Improvement**:
   - 25% increase in task completion rate
   - 30% reduction in task rescheduling
   - 20% improvement in focus time utilization

3. **User Satisfaction**:
   - NPS score > 50 for scheduling features
   - 4.5+ star rating for rule builder interface
   - Positive feedback on validation accuracy

4. **Reduced Support**:
   - 40% reduction in scheduling-related support tickets
   - 50% reduction in "how to schedule" questions
   - Improved user self-service capabilities

## Risk Mitigation

### Technical Risks:

1. **Performance Degradation**:
   - Implement caching for rule evaluation results
   - Use database indexing on frequently queried fields
   - Implement request rate limiting for validation endpoints

2. **Complex Rule Logic**:
   - Start with simple rules, gradually add complexity
   - Comprehensive testing of rule evaluation logic
   - Clear documentation of rule syntax and limitations

3. **Database Load**:
   - Add proper indexing on scheduling_rules table
   - Implement query optimization for rule evaluation
   - Consider read replicas for heavy validation loads

### User Experience Risks:

1. **Overwhelming Interface**:
   - Progressive disclosure of advanced features
   - Clear onboarding flow for new users
   - Helpful tooltips and documentation

2. **Rule Conflicts**:
   - Clear conflict resolution UI
   - Visual indicators for conflicting rules
   - Automatic conflict detection and warnings

3. **Learning Curve**:
   - Comprehensive onboarding and help documentation
   - Rule templates for common scenarios
   - Interactive tutorials for rule creation

## Dependencies & Prerequisites

### Backend Dependencies:

- FastAPI framework (already implemented)
- SQLAlchemy ORM (already implemented)
- PostgreSQL database (already implemented)
- JWT authentication (already implemented)

### Frontend Dependencies:

- React 18+ (already implemented)
- TypeScript (already implemented)
- FullCalendar library (already implemented)
- API client utilities (already implemented)

### External Dependencies:

- Date/time handling libraries (Python: datetime, frontend: date-fns)
- JSON schema validation (Pydantic, already implemented)
- Testing frameworks (pytest, Jest, already implemented)

## Next Steps & Handoff

### Week 9: Testing & Optimization

1. **Comprehensive Testing**: Complete all unit, integration, and end-to-end tests
2. **Performance Optimization**: Optimize database queries and API response times
3. **Security Review**: Audit rule evaluation logic for security vulnerabilities
4. **Documentation**: Complete API documentation and user guides

### Week 10: User Acceptance Testing

1. **Beta Testing**: Deploy to staging environment for user testing
2. **Bug Fixes**: Address issues found during testing
3. **Performance Monitoring**: Monitor real-world performance metrics
4. **User Feedback**: Collect and incorporate user feedback

### Phase 3 Preparation:

1. **Analytics Foundation**: Prepare data structures for Phase 3 analytics
2. **Goal Tracking**: Begin implementation of goal tracking features
3. **Performance Baselines**: Establish performance baselines for Phase 3
4. **Team Handoff**: Prepare handoff documentation for Phase 3 teams

## Conclusion

Phase 2 represents a significant step forward in the application's evolution from a basic task manager to an intelligent productivity tool. The implementation of the scheduling rules engine and validation system will provide users with powerful tools to optimize their productivity through intelligent task scheduling.

The focus on real-time validation, intelligent suggestions, and user-friendly rule creation will significantly enhance user productivity and satisfaction. The comprehensive testing strategy and performance requirements ensure that the system will be robust and responsive in production.

This phase builds upon the solid foundation established in Phase 1 and sets the stage for the advanced analytics and goal tracking features planned for Phase 3. The modular architecture allows for future enhancements while maintaining backward compatibility with existing functionality.

---

**Document Prepared By:** CTO  
**Next Review Date:** End of Week 8  
**Stakeholders:** Backend Data Team, Frontend Features Team, QA Team
