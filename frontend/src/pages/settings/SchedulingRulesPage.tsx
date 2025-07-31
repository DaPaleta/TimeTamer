import React, { useState, useEffect } from 'react'
import { getSchedulingRules, deleteSchedulingRule, type SchedulingRule } from '../../api/scheduling'
import RuleBuilder from '../../components/scheduling/RuleBuilder'
import './SchedulingRulesPage.css'

const SchedulingRulesPage: React.FC = () => {
  const [rules, setRules] = useState<SchedulingRule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showRuleBuilder, setShowRuleBuilder] = useState(false)
  const [editingRule, setEditingRule] = useState<SchedulingRule | undefined>()
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null)

  useEffect(() => {
    loadRules()
  }, [])

  const loadRules = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const fetchedRules = await getSchedulingRules()
      setRules(fetchedRules)
    } catch (err) {
      console.error('Failed to load rules:', err)
      setError('Failed to load scheduling rules. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateRule = () => {
    setEditingRule(undefined)
    setShowRuleBuilder(true)
  }

  const handleEditRule = (rule: SchedulingRule) => {
    setEditingRule(rule)
    setShowRuleBuilder(true)
  }

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule? This action cannot be undone.')) {
      return
    }

    setDeletingRuleId(ruleId)
    try {
      await deleteSchedulingRule(ruleId)
      setRules(rules.filter((rule) => rule.rule_id !== ruleId))
    } catch (err) {
      console.error('Failed to delete rule:', err)
      alert('Failed to delete rule. Please try again.')
    } finally {
      setDeletingRuleId(null)
    }
  }

  const handleSaveRule = (savedRule: SchedulingRule) => {
    if (editingRule) {
      // Update existing rule
      setRules(rules.map((rule) => (rule.rule_id === savedRule.rule_id ? savedRule : rule)))
    } else {
      // Add new rule
      setRules([...rules, savedRule])
    }
    setShowRuleBuilder(false)
    setEditingRule(undefined)
  }

  const handleCancelRuleBuilder = () => {
    setShowRuleBuilder(false)
    setEditingRule(undefined)
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'allow':
        return 'Allow'
      case 'block':
        return 'Block'
      case 'warn':
        return 'Warn'
      case 'suggest_alternative':
        return 'Suggest Alternative'
      default:
        return action
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'allow':
        return 'green'
      case 'block':
        return 'red'
      case 'warn':
        return 'orange'
      case 'suggest_alternative':
        return 'blue'
      default:
        return 'gray'
    }
  }

  const formatConditions = (conditions: any[]) => {
    if (!conditions || conditions.length === 0) {
      return 'No conditions'
    }

    return conditions
      .map((condition) => {
        const source = condition.source?.replace('_', ' ') || 'unknown'
        const field = condition.field?.replace('_', ' ') || 'unknown'
        const operator = condition.operator || 'unknown'
        const value = condition.value || 'unknown'

        return `${source} ${field} ${operator} ${value}`
      })
      .join(' AND ')
  }

  if (isLoading) {
    return (
      <div className="scheduling-rules-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading scheduling rules...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="scheduling-rules-page">
      <div className="page-header">
        <h1>Scheduling Rules</h1>
        <p>Create and manage rules that control how tasks are scheduled in your calendar.</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={loadRules} className="retry-button">
            Try Again
          </button>
        </div>
      )}

      <div className="rules-header">
        <div className="rules-info">
          <span className="rules-count">
            {rules.length} rule{rules.length !== 1 ? 's' : ''}
          </span>
          <span className="active-rules-count">
            {rules.filter((rule) => rule.is_active).length} active
          </span>
        </div>
        <button onClick={handleCreateRule} className="create-rule-button">
          + Create Rule
        </button>
      </div>

      {rules.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No scheduling rules yet</h3>
          <p>Create your first rule to start controlling how tasks are scheduled.</p>
          <button onClick={handleCreateRule} className="create-rule-button">
            Create Your First Rule
          </button>
        </div>
      ) : (
        <div className="rules-list">
          {rules.map((rule) => (
            <div key={rule.rule_id} className="rule-card">
              <div className="rule-header">
                <div className="rule-title">
                  <h3>{rule.name}</h3>
                  <div className="rule-status">
                    <span className={`status-badge ${rule.is_active ? 'active' : 'inactive'}`}>
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span
                      className="action-badge"
                      style={{ backgroundColor: getActionColor(rule.action) }}
                    >
                      {getActionLabel(rule.action)}
                    </span>
                  </div>
                </div>
                <div className="rule-priority">Priority: {rule.priority_order}</div>
              </div>

              {rule.description && <p className="rule-description">{rule.description}</p>}

              <div className="rule-conditions">
                <strong>Conditions:</strong>
                <p className="conditions-text">{formatConditions(rule.conditions)}</p>
              </div>

              {rule.alert_message && (
                <div className="rule-message">
                  <strong>Message:</strong>
                  <p>{rule.alert_message}</p>
                </div>
              )}

              <div className="rule-meta">
                <span>Created: {new Date(rule.created_at).toLocaleDateString()}</span>
                <span>Updated: {new Date(rule.updated_at).toLocaleDateString()}</span>
              </div>

              <div className="rule-actions">
                <button
                  onClick={() => handleEditRule(rule)}
                  className="edit-button"
                  disabled={deletingRuleId === rule.rule_id}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteRule(rule.rule_id)}
                  className="delete-button"
                  disabled={deletingRuleId === rule.rule_id}
                >
                  {deletingRuleId === rule.rule_id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <RuleBuilder
        rule={editingRule}
        onSave={handleSaveRule}
        onCancel={handleCancelRuleBuilder}
        isOpen={showRuleBuilder}
      />
    </div>
  )
}

export default SchedulingRulesPage
