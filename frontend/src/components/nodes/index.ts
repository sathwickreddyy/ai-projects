import type { NodeTypes } from '@xyflow/react'
import { KafkaBrokerNode } from './KafkaBrokerNode'
import { RedisCacheNode } from './RedisCacheNode'
import { PostgresDBNode } from './PostgresDBNode'
import { APIServiceNode } from './APIServiceNode'
import { ClientNode } from './ClientNode'
import { ExternalNode } from './ExternalNode'
import { ContainerNode } from './ContainerNode'

export const nodeTypes: NodeTypes = {
  kafka_broker: KafkaBrokerNode,
  redis_cache: RedisCacheNode,
  postgres_db: PostgresDBNode,
  api_service: APIServiceNode,
  client_actor: ClientNode,
  external_service: ExternalNode,
  container_box: ContainerNode,
}
