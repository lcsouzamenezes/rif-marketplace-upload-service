import { services } from '../app'
import Listr from 'listr'

import { sequelizeFactory } from '../sequelize'
import { BaseCLICommand, capitalizeFirstLetter, validateServices } from '../utils'
import { SupportedServices } from '../definitions'

export default class Purge extends BaseCLICommand {
  static get description () {
    const formattedServices = Object.values(SupportedServices).map(service => ` - ${service}`).join('\n')
    return `purge cached data

Can purge all data or for specific service.
Currently supported services:
 - all
${formattedServices}`
  }

  static examples = [
    '$ rif-storage-upload-service purge all',
    '$ rif-storage-upload-service purge storage rns'
  ]

  static flags = BaseCLICommand.flags

  static args = [{ name: 'service' }]

  static strict = false

  async run (): Promise<void> {
    const { argv } = this.parse(Purge)

    let servicesToPurge
    try {
      servicesToPurge = validateServices(argv)
    } catch (e) {
      this.error(e.message)
    }

    // Init database connection
    const sequelize = sequelizeFactory()

    const tasksDefinition = servicesToPurge.map(
      serviceName => {
        return {
          title: capitalizeFirstLetter(serviceName),
          task: services[serviceName].purge
        }
      }
    )

    this.log('Removing cached data for service:')
    const tasks = new Listr(tasksDefinition)
    await tasks.run()
    this.exit(0)
  }
}
